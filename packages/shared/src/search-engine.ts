import {
  Product,
  SearchMerchandisingRule,
  SearchQueryIntent,
  SearchResponse,
  SearchResultItem,
  SearchSynonym,
} from './types.js';

/**
 * Computes standard Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Parses user search query to extract intent (price bounds, category tags)
 */
export function parseSearchIntent(rawQuery: string): SearchQueryIntent {
  const q = rawQuery.toLowerCase().trim();
  let cleanQuery = q;
  let maxPriceInPaise: number | undefined;
  let minPriceInPaise: number | undefined;
  let detectedCategory: string | undefined;
  const extractedTags: string[] = [];

  // 1. Detect price bounds (e.g. "under 2000", "below 1500", "above 1000")
  const underMatch = q.match(/(?:under|below|less than|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (underMatch) {
    const val = parseInt(underMatch[1], 10);
    maxPriceInPaise = val * 100;
    cleanQuery = cleanQuery.replace(underMatch[0], '').trim();
  }

  const aboveMatch = q.match(/(?:above|over|more than|min)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (aboveMatch) {
    const val = parseInt(aboveMatch[1], 10);
    minPriceInPaise = val * 100;
    cleanQuery = cleanQuery.replace(aboveMatch[0], '').trim();
  }

  // 2. Detect category intents
  if (/sneaker|shoe|runner|footwear|kicks/i.test(q)) {
    detectedCategory = 'Footwear';
    extractedTags.push('footwear');
  } else if (/hoodie|tee|t-shirt|shirt|pants|cargo|streetwear/i.test(q)) {
    detectedCategory = 'Streetwear';
    extractedTags.push('streetwear');
  } else if (/cap|hat|tote|bag|sling|bottle|tumbler|accessories/i.test(q)) {
    detectedCategory = 'Accessories';
    extractedTags.push('accessories');
  }

  return {
    rawQuery,
    cleanQuery: cleanQuery.replace(/\s+/g, ' ').trim(),
    detectedCategory,
    maxPriceInPaise,
    minPriceInPaise,
    extractedTags,
  };
}

/**
 * Expands query tokens using a dictionary of synonyms
 */
export function expandSynonyms(tokens: string[], synonyms: SearchSynonym[]): string[] {
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    for (const s of synonyms) {
      if (!s.active) continue;
      if (s.triggerWord.toLowerCase() === token.toLowerCase()) {
        for (const rep of s.replacementWords) {
          expanded.add(rep.toLowerCase());
        }
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Primary Hybrid Search Execution Function
 */
export function executeSearchX(
  rawQuery: string,
  catalog: Product[],
  options: {
    synonyms?: SearchSynonym[];
    merchandisingRules?: SearchMerchandisingRule[];
    categoryFilter?: string;
    minPricePaise?: number;
    maxPricePaise?: number;
    limit?: number;
  } = {}
): SearchResponse {
  const startTime = Date.now();
  const {
    synonyms = [],
    merchandisingRules = [],
    categoryFilter,
    minPricePaise,
    maxPricePaise,
    limit = 20,
  } = options;

  // 1. Parse intent
  const intent = parseSearchIntent(rawQuery);
  const cleanQ = intent.cleanQuery || rawQuery.toLowerCase().trim();

  // 2. Tokenize & expand synonyms
  const rawTokens = cleanQ.split(/\s+/).filter((t) => t.length > 1);
  const searchTokens = expandSynonyms(rawTokens, synonyms);

  // 3. Check for exact merchandising rules
  const rule = merchandisingRules.find(
    (r) => r.active && r.query.toLowerCase().trim() === cleanQ
  );

  const pinnedSet = new Set(rule?.pinnedProductIds || []);
  const buriedSet = new Set(rule?.buriedProductIds || []);
  const boostedTags = new Set(rule?.boostedTags || []);

  const effectiveMinPrice = minPricePaise ?? intent.minPriceInPaise;
  const effectiveMaxPrice = maxPricePaise ?? intent.maxPriceInPaise;
  const effectiveCategory = categoryFilter ?? intent.detectedCategory;

  const scoredItems: SearchResultItem[] = [];

  for (const product of catalog) {
    if (!product.isAvailable) continue;

    // Filters: Category & Price
    if (effectiveCategory && product.category.toLowerCase() !== effectiveCategory.toLowerCase()) {
      continue;
    }
    if (effectiveMinPrice !== undefined && product.priceInPaise < effectiveMinPrice) {
      continue;
    }
    if (effectiveMaxPrice !== undefined && product.priceInPaise > effectiveMaxPrice) {
      continue;
    }

    // Check pinned status
    if (pinnedSet.has(product.id)) {
      scoredItems.push({
        product,
        score: 1000,
        matchType: 'pinned',
        matchedTerms: ['Merchandiser Pinned'],
      });
      continue;
    }

    if (buriedSet.has(product.id)) {
      continue; // Skip or demote
    }

    let lexicalScore = 0;
    let semanticScore = 0;
    const matchedTerms: string[] = [];
    let matchType: SearchResultItem['matchType'] = 'exact';

    const titleLower = product.title.toLowerCase();
    const descLower = product.description.toLowerCase();
    const tagsLower = product.tags.map((t) => t.toLowerCase());

    // A. Lexical Keyword Matching
    for (const token of searchTokens) {
      if (titleLower.includes(token)) {
        lexicalScore += 50;
        matchedTerms.push(token);
      } else if (tagsLower.some((t) => t.includes(token))) {
        lexicalScore += 35;
        matchedTerms.push(token);
      } else if (descLower.includes(token)) {
        lexicalScore += 15;
        matchedTerms.push(token);
      } else {
        // Check for typo tolerance (1 or 2 edit distance for tokens >= 4 chars)
        if (token.length >= 4) {
          const titleWords = titleLower.split(/\s+/);
          for (const tw of titleWords) {
            if (tw.length >= 4 && levenshteinDistance(token, tw) <= 1) {
              lexicalScore += 25;
              matchedTerms.push(`${token} ≈ ${tw}`);
              matchType = 'typo_match';
              break;
            }
          }
        }
      }
    }

    // B. Semantic Intent & Attribute Affinity Scoring
    for (const tag of intent.extractedTags) {
      if (tagsLower.includes(tag) || product.category.toLowerCase().includes(tag)) {
        semanticScore += 30;
      }
    }

    // Merchandising Boosted Tags
    for (const bt of boostedTags) {
      if (tagsLower.includes(bt.toLowerCase())) {
        lexicalScore += 40;
      }
    }

    const totalScore = lexicalScore + semanticScore;

    if (totalScore > 0 || cleanQ.length === 0) {
      scoredItems.push({
        product,
        score: totalScore || 10,
        matchType: matchType === 'typo_match' ? 'typo_match' : 'exact',
        matchedTerms: Array.from(new Set(matchedTerms)),
      });
    }
  }

  // Sort descending by score
  scoredItems.sort((a, b) => b.score - a.score);

  // Compute Facets
  const categoryCountMap: Record<string, number> = {};
  for (const item of scoredItems) {
    const cat = item.product.category;
    categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
  }

  const categoriesFacet = Object.entries(categoryCountMap).map(([name, count]) => ({
    name,
    count,
  }));

  const priceRanges = [
    { label: 'Under ₹1,000', count: 0, min: 0, max: 100000 },
    { label: '₹1,000 - ₹2,500', count: 0, min: 100000, max: 250000 },
    { label: '₹2,500 - ₹5,000', count: 0, min: 250000, max: 500000 },
  ];

  for (const item of scoredItems) {
    const p = item.product.priceInPaise;
    if (p < 100000) priceRanges[0].count++;
    else if (p <= 250000) priceRanges[1].count++;
    else priceRanges[2].count++;
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    query: rawQuery,
    intent,
    total: scoredItems.length,
    items: scoredItems.slice(0, limit),
    facets: {
      categories: categoriesFacet,
      priceRanges,
    },
    executionTimeMs,
  };
}
