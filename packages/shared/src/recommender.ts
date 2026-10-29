import { CartItem, Product, UpsellRule } from './types.js';

export interface RecommendedProduct extends Product {
  badgeText?: string;
  specialDiscountPct?: number;
  discountedPriceInPaise?: number;
  reason?: string;
}

export function getUpsellRecommendations(
  cartItems: CartItem[],
  catalog: Product[],
  rules: UpsellRule[] = [],
  limit = 4
): RecommendedProduct[] {
  if (!catalog || catalog.length === 0) return [];

  const cartProductIds = new Set(cartItems.map((item) => item.productId));

  // Determine hidden products from rules
  const hiddenProductIds = new Set<string>();
  const pinnedProducts: RecommendedProduct[] = [];

  for (const rule of rules) {
    if (rule.isHidden) {
      for (const id of rule.targetProductIds) {
        hiddenProductIds.add(id);
      }
    }
  }

  // Find pinned products matching cart context (specific product, or global)
  for (const rule of rules) {
    if (rule.isPinned) {
      // Check if rule matches
      let matches = false;
      if (rule.sourceType === 'global') {
        matches = true;
      } else if (rule.sourceType === 'product' && rule.sourceId) {
        matches = cartProductIds.has(rule.sourceId);
      }

      if (matches) {
        for (const targetId of rule.targetProductIds) {
          if (!cartProductIds.has(targetId) && !hiddenProductIds.has(targetId)) {
            const product = catalog.find((p) => p.id === targetId);
            if (product && !pinnedProducts.some((p) => p.id === product.id)) {
              const discountPct = rule.customDiscountPct || 0;
              const discountedPrice =
                discountPct > 0
                  ? Math.round(product.priceInPaise * (1 - discountPct / 100))
                  : product.priceInPaise;

              pinnedProducts.push({
                ...product,
                badgeText: rule.badgeText || (discountPct > 0 ? `${discountPct}% OFF In-Cart` : 'Top Pick'),
                specialDiscountPct: discountPct,
                discountedPriceInPaise: discountedPrice,
                reason: 'Merchandiser Curated',
              });
            }
          }
        }
      }
    }
  }

  // If we already have enough pinned items, return top N
  if (pinnedProducts.length >= limit) {
    return pinnedProducts.slice(0, limit);
  }

  // Smart scoring for non-pinned candidates
  const cartCategories = new Set(
    cartItems
      .map((item) => catalog.find((p) => p.id === item.productId)?.category)
      .filter(Boolean) as string[]
  );

  const cartTags = new Set(
    cartItems.flatMap((item) => catalog.find((p) => p.id === item.productId)?.tags || [])
  );

  const avgCartPrice =
    cartItems.reduce((acc, item) => acc + item.priceInPaise, 0) / (cartItems.length || 1);

  // Cross-category affinities (e.g. Shoes -> Accessories/Care; Apparel -> Accessories)
  const categoryAffinity: Record<string, string[]> = {
    Footwear: ['Accessories', 'Shoe Care', 'Apparel'],
    Apparel: ['Accessories', 'Streetwear', 'Footwear'],
    Accessories: ['Apparel', 'Footwear'],
  };

  const candidates: Array<{ product: Product; score: number; reason: string }> = [];

  for (const product of catalog) {
    if (cartProductIds.has(product.id) || hiddenProductIds.has(product.id)) continue;
    if (pinnedProducts.some((p) => p.id === product.id)) continue;
    if (!product.isAvailable || product.inventoryCount <= 0) continue;

    let score = 0;
    let reason = 'Trending addition';

    // 1. Tag overlap (high relevance)
    const matchingTags = product.tags.filter((t) => cartTags.has(t));
    if (matchingTags.length > 0) {
      score += matchingTags.length * 25;
      reason = `Matches your style (${matchingTags[0]})`;
    }

    // 2. Cross-category affinity
    for (const cat of cartCategories) {
      const affinities = categoryAffinity[cat] || [];
      if (affinities.includes(product.category)) {
        score += 30;
        reason = `Pairs well with ${cat}`;
        break;
      }
    }

    // 3. Price bracket optimization: accessories and add-ons priced between 20% and 50% of avg item price convert best
    const priceRatio = product.priceInPaise / (avgCartPrice || 1);
    if (priceRatio >= 0.15 && priceRatio <= 0.6) {
      score += 20; // Impulse buy sweet-spot
    }

    // 4. In stock bonus
    if (product.inventoryCount > 5) {
      score += 5;
    }

    candidates.push({ product, score, reason });
  }

  candidates.sort((a, b) => b.score - a.score);

  const algorithmicPicks: RecommendedProduct[] = candidates.slice(0, limit - pinnedProducts.length).map((c) => ({
    ...c.product,
    badgeText: c.score > 40 ? 'Recommended' : 'Trending',
    reason: c.reason,
  }));

  return [...pinnedProducts, ...algorithmicPicks];
}
