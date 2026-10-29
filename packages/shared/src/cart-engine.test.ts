import { describe, it, expect } from 'vitest';
import { calculateCartPricing } from './cart-engine.js';
import { assignVariant } from './ab-testing.js';
import { getUpsellRecommendations } from './recommender.js';
import { CartItem, Product, ProgressTier, Coupon, FreebieRule, Experiment } from './types.js';

const mockCatalog: Product[] = [
  {
    id: 'prod_tee',
    storeId: 'store_1',
    title: 'Oversized Heavyweight Tee',
    handle: 'oversized-tee',
    description: '100% French Terry cotton.',
    priceInPaise: 129900, // ₹1,299
    compareAtPriceInPaise: 169900, // ₹1,699
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
    category: 'Apparel',
    tags: ['streetwear', 'cotton', 'oversized'],
    inventoryCount: 45,
    isAvailable: true,
  },
  {
    id: 'prod_hoodie',
    storeId: 'store_1',
    title: 'Acid Wash Boxy Hoodie',
    handle: 'acid-wash-hoodie',
    description: '450 GSM luxury fleece.',
    priceInPaise: 249900, // ₹2,499
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
    category: 'Apparel',
    tags: ['streetwear', 'winter', 'fleece'],
    inventoryCount: 20,
    isAvailable: true,
  },
  {
    id: 'prod_tote',
    storeId: 'store_1',
    title: 'Canvas Essential Tote Bag',
    handle: 'canvas-tote',
    description: 'Heavy duty natural canvas.',
    priceInPaise: 49900, // ₹499
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
    category: 'Accessories',
    tags: ['tote', 'canvas', 'freebie'],
    inventoryCount: 100,
    isAvailable: true,
  },
  {
    id: 'prod_cap',
    storeId: 'store_1',
    title: 'Vintage Washed Dad Cap',
    handle: 'vintage-cap',
    description: 'Embroidered low profile cap.',
    priceInPaise: 69900, // ₹699
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
    category: 'Accessories',
    tags: ['streetwear', 'cap', 'accessory'],
    inventoryCount: 30,
    isAvailable: true,
  },
];

const mockTiers: ProgressTier[] = [
  {
    id: 'tier_1',
    thresholdInPaise: 99900, // ₹999
    rewardType: 'free_shipping',
    rewardValue: 0,
    label: 'Free Shipping',
    icon: 'truck',
  },
  {
    id: 'tier_2',
    thresholdInPaise: 199900, // ₹1,999
    rewardType: 'freebie',
    rewardValue: 0,
    label: 'Free Canvas Tote',
    icon: 'gift',
    freeProductId: 'prod_tote',
  },
  {
    id: 'tier_3',
    thresholdInPaise: 299900, // ₹2,999
    rewardType: 'discount_pct',
    rewardValue: 10, // 10% OFF
    label: '10% Extra Discount',
    icon: 'percent',
  },
];

describe('CartX Core Engine', () => {
  it('calculates subtotal and next tier for cart below tier 1', () => {
    const items: CartItem[] = [
      {
        id: 'item_1',
        productId: 'prod_cap',
        title: 'Vintage Washed Dad Cap',
        priceInPaise: 69900,
        quantity: 1,
        imageUrl: '...',
      },
    ];

    const result = calculateCartPricing({
      items,
      tiers: mockTiers,
      catalog: mockCatalog,
      shippingFeeInPaise: 9900,
    });

    expect(result.subtotalInPaise).toBe(69900);
    expect(result.shippingFeeInPaise).toBe(9900);
    expect(result.grandTotalInPaise).toBe(69900 + 9900);
    expect(result.nextTier).not.toBeNull();
    expect(result.nextTier?.tier.id).toBe('tier_1');
    expect(result.nextTier?.amountNeededInPaise).toBe(99900 - 69900);
    expect(result.nextTier?.progressPct).toBe(Math.round((69900 / 99900) * 100));
  });

  it('unlocks free shipping at ₹999 tier', () => {
    const items: CartItem[] = [
      {
        id: 'item_1',
        productId: 'prod_tee',
        title: 'Oversized Heavyweight Tee',
        priceInPaise: 129900,
        quantity: 1,
        imageUrl: '...',
      },
    ];

    const result = calculateCartPricing({
      items,
      tiers: mockTiers,
      catalog: mockCatalog,
      shippingFeeInPaise: 9900,
    });

    expect(result.subtotalInPaise).toBe(129900);
    expect(result.shippingFeeInPaise).toBe(0); // Free shipping
    expect(result.activeTiersReached.some((t) => t.id === 'tier_1')).toBe(true);
    expect(result.nextTier?.tier.id).toBe('tier_2');
  });

  it('auto-adds free tote bag gift when cart passes ₹1,999', () => {
    const items: CartItem[] = [
      {
        id: 'item_1',
        productId: 'prod_hoodie',
        title: 'Acid Wash Boxy Hoodie',
        priceInPaise: 249900,
        quantity: 1,
        imageUrl: '...',
      },
    ];

    const result = calculateCartPricing({
      items,
      tiers: mockTiers,
      catalog: mockCatalog,
      shippingFeeInPaise: 9900,
    });

    expect(result.subtotalInPaise).toBe(249900);
    expect(result.autoAddedFreebies.length).toBe(1);
    expect(result.autoAddedFreebies[0].productId).toBe('prod_tote');
    expect(result.autoAddedFreebies[0].priceInPaise).toBe(0);
    expect(result.autoAddedFreebies[0].isFreebie).toBe(true);
    expect(result.items.length).toBe(2); // Regular hoodie + freebie tote
  });

  it('applies 10% discount when cart passes ₹2,999 tier', () => {
    const items: CartItem[] = [
      {
        id: 'item_1',
        productId: 'prod_hoodie',
        title: 'Acid Wash Boxy Hoodie',
        priceInPaise: 249900,
        quantity: 1,
        imageUrl: '...',
      },
      {
        id: 'item_2',
        productId: 'prod_tee',
        title: 'Oversized Heavyweight Tee',
        priceInPaise: 129900,
        quantity: 1,
        imageUrl: '...',
      },
    ];

    // Subtotal = 249900 + 129900 = 379800 (> 299900)
    const result = calculateCartPricing({
      items,
      tiers: mockTiers,
      catalog: mockCatalog,
      shippingFeeInPaise: 9900,
    });

    const expectedDiscount = Math.round(379800 * 0.1);
    expect(result.subtotalInPaise).toBe(379800);
    expect(result.discountInPaise).toBe(expectedDiscount);
    expect(result.shippingFeeInPaise).toBe(0);
    expect(result.grandTotalInPaise).toBe(379800 - expectedDiscount);
  });

  it('validates coupons, enforces min spend and discount limits', () => {
    const coupons: Coupon[] = [
      {
        id: 'c_1',
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        minSpendInPaise: 200000, // ₹2,000 min spend
        maxDiscountInPaise: 50000, // Max ₹500 discount cap
        isStackable: true,
        autoApply: false,
        description: '20% OFF above ₹2,000 (Max ₹500)',
        active: true,
      },
    ];

    const items: CartItem[] = [
      {
        id: 'item_1',
        productId: 'prod_tee',
        title: 'Oversized Heavyweight Tee',
        priceInPaise: 129900, // Below ₹2,000
        quantity: 1,
        imageUrl: '...',
      },
    ];

    // Attempt coupon below min spend
    const resultFail = calculateCartPricing({
      items,
      coupons,
      appliedCouponCode: 'SAVE20',
    });
    expect(resultFail.appliedCoupon).toBeUndefined();
    expect(resultFail.couponError).toContain('Minimum spend');

    // Increase qty to 3 -> Subtotal = ₹3,897 (> ₹2,000)
    items[0].quantity = 3;
    const resultSuccess = calculateCartPricing({
      items,
      coupons,
      appliedCouponCode: 'SAVE20',
    });
    expect(resultSuccess.appliedCoupon?.code).toBe('SAVE20');
    // 20% of 389700 is 77940, but capped at 50000
    expect(resultSuccess.discountInPaise).toBe(50000);
  });
});

describe('A/B Testing Deterministic Assignment', () => {
  const experiment: Experiment = {
    id: 'exp_cart_gamification',
    storeId: 'store_1',
    name: 'Cart Gamification Test',
    status: 'running',
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: 'var_control',
        experimentId: 'exp_cart_gamification',
        name: 'Control (Standard Cart)',
        trafficPct: 50,
      },
      {
        id: 'var_gamified',
        experimentId: 'exp_cart_gamification',
        name: 'Variant B (Gamified Multi-Tier + Auto Freebie)',
        trafficPct: 50,
      },
    ],
  };

  it('guarantees sticky variant assignment for the same visitor', () => {
    const visitor1 = 'user_abc_123';
    const variantFirst = assignVariant(visitor1, experiment);
    const variantSecond = assignVariant(visitor1, experiment);
    const variantThird = assignVariant(visitor1, experiment);

    expect(variantFirst.id).toBe(variantSecond.id);
    expect(variantSecond.id).toBe(variantThird.id);
  });

  it('distributes 1000 visitors roughly 50/50', () => {
    let countControl = 0;
    let countGamified = 0;

    for (let i = 0; i < 1000; i++) {
      const v = assignVariant(`visitor_${i}`, experiment);
      if (v.id === 'var_control') countControl++;
      else countGamified++;
    }

    // Expect close to 500 each (+/- 6%)
    expect(countControl).toBeGreaterThan(440);
    expect(countControl).toBeLessThan(560);
    expect(countControl + countGamified).toBe(1000);
  });
});

describe('AI Upsell Recommender & Manual Override', () => {
  it('excludes items already in the cart and highlights relevant accessories', () => {
    const cartItems: CartItem[] = [
      {
        id: 'i1',
        productId: 'prod_tee',
        title: 'Oversized Heavyweight Tee',
        priceInPaise: 129900,
        quantity: 1,
        imageUrl: '...',
      },
    ];

    const recs = getUpsellRecommendations(cartItems, mockCatalog, [], 3);

    // Tee should NOT be in recommendations
    expect(recs.some((r) => r.id === 'prod_tee')).toBe(false);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('respects merchant pinned override with custom discount badge', () => {
    const cartItems: CartItem[] = [
      {
        id: 'i1',
        productId: 'prod_tee',
        title: 'Oversized Heavyweight Tee',
        priceInPaise: 129900,
        quantity: 1,
        imageUrl: '...',
      },
    ];

    const rules = [
      {
        id: 'rule_pin_cap',
        storeId: 'store_1',
        sourceType: 'global' as const,
        targetProductIds: ['prod_cap'],
        isPinned: true,
        isHidden: false,
        customDiscountPct: 15,
        badgeText: '15% Off with Tee',
      },
    ];

    const recs = getUpsellRecommendations(cartItems, mockCatalog, rules, 3);

    expect(recs[0].id).toBe('prod_cap');
    expect(recs[0].badgeText).toBe('15% Off with Tee');
    expect(recs[0].specialDiscountPct).toBe(15);
    // Original ₹699 (69900 paise) with 15% off = 59415 paise
    expect(recs[0].discountedPriceInPaise).toBe(59415);
  });
});
