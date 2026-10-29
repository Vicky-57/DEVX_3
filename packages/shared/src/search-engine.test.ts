import { describe, it, expect } from 'vitest';
import { executeSearchX, levenshteinDistance, parseSearchIntent } from './search-engine.js';
import { Product, SearchMerchandisingRule, SearchSynonym } from './types.js';

const mockCatalog: Product[] = [
  {
    id: 'prod_tee',
    storeId: 'store_1',
    title: 'Aura Heavyweight Boxy Tee',
    handle: 'aura-heavyweight-tee',
    description: '280 GSM combed cotton.',
    priceInPaise: 129900, // ₹1,299
    imageUrl: '...',
    category: 'Streetwear',
    tags: ['streetwear', 'tee', 'cotton', 'oversized'],
    inventoryCount: 40,
    isAvailable: true,
  },
  {
    id: 'prod_hoodie',
    storeId: 'store_1',
    title: 'Acid Wash Heavy Fleece Hoodie',
    handle: 'acid-wash-fleece-hoodie',
    description: '450 GSM French Terry luxury winter hoodie.',
    priceInPaise: 249900, // ₹2,499
    imageUrl: '...',
    category: 'Streetwear',
    tags: ['hoodie', 'fleece', 'winter', 'luxury'],
    inventoryCount: 25,
    isAvailable: true,
  },
  {
    id: 'prod_sneaker',
    storeId: 'store_1',
    title: 'Aura Horizon Chunky Sneakers',
    handle: 'aura-horizon-chunky-sneakers',
    description: 'Split-suede overlays with EVA shock absorption shoes.',
    priceInPaise: 399900, // ₹3,999
    imageUrl: '...',
    category: 'Footwear',
    tags: ['sneakers', 'footwear', 'chunky', 'shoes'],
    inventoryCount: 15,
    isAvailable: true,
  },
  {
    id: 'prod_cap',
    storeId: 'store_1',
    title: 'Washed Twill Low-Profile Dad Cap',
    handle: 'washed-twill-dad-cap',
    description: 'Unstructured 6-panel embroidered hat.',
    priceInPaise: 69900, // ₹699
    imageUrl: '...',
    category: 'Accessories',
    tags: ['cap', 'hat', 'accessories', 'headwear'],
    inventoryCount: 50,
    isAvailable: true,
  },
];

describe('SearchX Algorithm Core', () => {
  it('calculates correct Levenshtein distance', () => {
    expect(levenshteinDistance('hoodie', 'hoddie')).toBe(1);
    expect(levenshteinDistance('sneakers', 'sneekers')).toBe(1);
    expect(levenshteinDistance('shoes', 'shooes')).toBe(1);
    expect(levenshteinDistance('same', 'same')).toBe(0);
  });

  it('parses natural language search intent and price constraints', () => {
    const intent = parseSearchIntent('black hoodie under 2500');
    expect(intent.maxPriceInPaise).toBe(250000);
    expect(intent.detectedCategory).toBe('Streetwear');
    expect(intent.cleanQuery).toBe('black hoodie');
  });

  it('matches exact keywords with high relevance scores', () => {
    const res = executeSearchX('hoodie', mockCatalog);
    expect(res.total).toBeGreaterThan(0);
    expect(res.items[0].product.id).toBe('prod_hoodie');
    expect(res.items[0].matchType).toBe('exact');
  });

  it('tolerates typos like "sneekers" to match sneakers', () => {
    const res = executeSearchX('sneekers', mockCatalog);
    expect(res.total).toBeGreaterThan(0);
    expect(res.items[0].product.id).toBe('prod_sneaker');
    expect(res.items[0].matchType).toBe('typo_match');
  });

  it('expands synonyms (e.g. "kicks" -> sneakers / footwear)', () => {
    const synonyms: SearchSynonym[] = [
      {
        id: 'syn_1',
        storeId: 'store_1',
        triggerWord: 'kicks',
        replacementWords: ['sneakers', 'shoes', 'footwear'],
        active: true,
      },
    ];

    const res = executeSearchX('kicks', mockCatalog, { synonyms });
    expect(res.total).toBeGreaterThan(0);
    expect(res.items[0].product.id).toBe('prod_sneaker');
  });

  it('respects merchandiser pinned rules and forces item to position 1', () => {
    const rules: SearchMerchandisingRule[] = [
      {
        id: 'rule_1',
        storeId: 'store_1',
        query: 'summer',
        pinnedProductIds: ['prod_cap'],
        boostedTags: [],
        buriedProductIds: [],
        active: true,
      },
    ];

    const res = executeSearchX('summer', mockCatalog, { merchandisingRules: rules });
    expect(res.items[0].product.id).toBe('prod_cap');
    expect(res.items[0].matchType).toBe('pinned');
  });
});
