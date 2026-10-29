import {
  CartItem,
  CartPricingInput,
  CartPricingResult,
  Coupon,
  ProgressTier,
  SavingsBreakdownItem,
} from './types.js';

export function calculateCartPricing(input: CartPricingInput): CartPricingResult {
  const {
    items = [],
    tiers = [],
    freebieRules = [],
    bundleOffers = [],
    coupons = [],
    catalog = [],
    appliedCouponCode,
    shippingFeeInPaise = 9900, // Default ₹99
    config,
  } = input;

  // 1. Separate regular items from auto-added freebies (we re-evaluate freebies dynamically)
  const regularItems = items.filter((item) => !item.isFreebie);

  // 2. Compute base subtotal & regular item count
  let subtotalInPaise = 0;
  let itemCount = 0;
  let compareAtSavingsInPaise = 0;

  for (const item of regularItems) {
    const itemTotal = item.priceInPaise * item.quantity;
    subtotalInPaise += itemTotal;
    itemCount += item.quantity;

    if (item.compareAtPriceInPaise && item.compareAtPriceInPaise > item.priceInPaise) {
      compareAtSavingsInPaise +=
        (item.compareAtPriceInPaise - item.priceInPaise) * item.quantity;
    }
  }

  const savingsBreakdown: SavingsBreakdownItem[] = [];

  if (compareAtSavingsInPaise > 0) {
    savingsBreakdown.push({
      label: 'Catalog Price Drop',
      amountInPaise: compareAtSavingsInPaise,
      type: 'bundle',
    });
  }

  // 3. Progress Tiers evaluation
  const sortedTiers = [...tiers].sort((a, b) => a.thresholdInPaise - b.thresholdInPaise);
  const activeTiersReached: ProgressTier[] = [];
  let nextTier: CartPricingResult['nextTier'] = null;

  let tierShippingFree = false;
  let tierDiscountInPaise = 0;
  const autoAddedFreebies: CartItem[] = [];

  for (const tier of sortedTiers) {
    if (subtotalInPaise >= tier.thresholdInPaise) {
      activeTiersReached.push(tier);

      if (tier.rewardType === 'free_shipping') {
        tierShippingFree = true;
      } else if (tier.rewardType === 'discount_pct') {
        const discount = Math.round(subtotalInPaise * (tier.rewardValue / 100));
        tierDiscountInPaise += discount;
        savingsBreakdown.push({
          label: `${tier.label} (${tier.rewardValue}% OFF)`,
          amountInPaise: discount,
          type: 'tier',
        });
      } else if (tier.rewardType === 'fixed_discount') {
        tierDiscountInPaise += tier.rewardValue;
        savingsBreakdown.push({
          label: tier.label,
          amountInPaise: tier.rewardValue,
          type: 'tier',
        });
      } else if (tier.rewardType === 'freebie' && tier.freeProductId) {
        const freeProduct = catalog.find((p) => p.id === tier.freeProductId);
        if (freeProduct) {
          autoAddedFreebies.push({
            id: `freebie_tier_${tier.id}`,
            productId: freeProduct.id,
            title: `[FREE] ${freeProduct.title}`,
            priceInPaise: 0,
            compareAtPriceInPaise: freeProduct.priceInPaise,
            quantity: 1,
            imageUrl: freeProduct.imageUrl,
            isFreebie: true,
            freebieRuleId: tier.id,
          });
          savingsBreakdown.push({
            label: `Free Gift (${freeProduct.title})`,
            amountInPaise: freeProduct.priceInPaise,
            type: 'freebie',
          });
        }
      }
    } else if (!nextTier) {
      // First tier not yet reached
      const amountNeeded = tier.thresholdInPaise - subtotalInPaise;
      const progressPct = Math.min(100, Math.round((subtotalInPaise / tier.thresholdInPaise) * 100));
      nextTier = {
        tier,
        amountNeededInPaise: amountNeeded,
        progressPct,
      };
    }
  }

  // 4. Freebie Rules evaluation
  for (const rule of freebieRules) {
    if (rule.active && subtotalInPaise >= rule.minSpendInPaise) {
      // Check if already awarded via tier
      const alreadyAwarded = autoAddedFreebies.some((f) => f.productId === rule.freeProductId);
      if (!alreadyAwarded) {
        const freeProduct = catalog.find((p) => p.id === rule.freeProductId);
        if (freeProduct) {
          autoAddedFreebies.push({
            id: `freebie_rule_${rule.id}`,
            productId: freeProduct.id,
            title: `[FREE GIFT] ${freeProduct.title}`,
            priceInPaise: 0,
            compareAtPriceInPaise: freeProduct.priceInPaise,
            quantity: 1,
            imageUrl: freeProduct.imageUrl,
            isFreebie: true,
            freebieRuleId: rule.id,
          });
          savingsBreakdown.push({
            label: `${rule.label} (${freeProduct.title})`,
            amountInPaise: freeProduct.priceInPaise,
            type: 'freebie',
          });
        }
      }
    }
  }

  // 5. Bundle Offers evaluation
  let bundleDiscountInPaise = 0;
  for (const bundle of bundleOffers) {
    if (!bundle.active) continue;

    // Check if all trigger items are in cart
    const hasAllTriggers = bundle.triggerProductIds.every((triggerId) =>
      regularItems.some((item) => item.productId === triggerId)
    );

    if (hasAllTriggers) {
      // Check if discounted item is in cart
      const targetItem = regularItems.find((item) => item.productId === bundle.discountedProductId);
      if (targetItem) {
        const discountAmount = Math.round(
          targetItem.priceInPaise * (bundle.discountPercent / 100) * targetItem.quantity
        );
        bundleDiscountInPaise += discountAmount;
        savingsBreakdown.push({
          label: `${bundle.title} (${bundle.discountPercent}% OFF)`,
          amountInPaise: discountAmount,
          type: 'bundle',
        });
      }
    }
  }

  // 6. Coupon & Savings Engine
  let appliedCoupon: Coupon | undefined;
  let couponDiscountInPaise = 0;
  let couponError: string | undefined;

  // Determine active coupon: either manually applied or eligible auto-apply coupon
  let candidateCoupon: Coupon | undefined;

  if (appliedCouponCode) {
    const matched = coupons.find(
      (c) => c.code.trim().toUpperCase() === appliedCouponCode.trim().toUpperCase()
    );
    if (!matched) {
      couponError = `Coupon code "${appliedCouponCode}" is invalid.`;
    } else if (!matched.active) {
      couponError = `Coupon code "${appliedCouponCode}" has expired.`;
    } else if (subtotalInPaise < matched.minSpendInPaise) {
      const minSpendRs = matched.minSpendInPaise / 100;
      couponError = `Minimum spend of ₹${minSpendRs} required for code "${matched.code}".`;
    } else {
      candidateCoupon = matched;
    }
  } else {
    // Check for auto-apply coupons
    const autoCoupons = coupons
      .filter((c) => c.active && c.autoApply && subtotalInPaise >= c.minSpendInPaise)
      .sort((a, b) => b.value - a.value); // Pick best value

    if (autoCoupons.length > 0) {
      candidateCoupon = autoCoupons[0];
    }
  }

  if (candidateCoupon) {
    let discount = 0;
    if (candidateCoupon.type === 'percentage') {
      discount = Math.round(subtotalInPaise * (candidateCoupon.value / 100));
    } else if (candidateCoupon.type === 'fixed_amount') {
      discount = candidateCoupon.value;
    } else if (candidateCoupon.type === 'free_shipping') {
      tierShippingFree = true;
    }

    if (candidateCoupon.maxDiscountInPaise && discount > candidateCoupon.maxDiscountInPaise) {
      discount = candidateCoupon.maxDiscountInPaise;
    }

    // Check stacking rules: if not stackable and tier discount is already applied, check which is better
    if (!candidateCoupon.isStackable && tierDiscountInPaise > 0) {
      if (discount > tierDiscountInPaise) {
        // Coupon gives better discount; replace tier discount
        tierDiscountInPaise = 0;
        couponDiscountInPaise = discount;
        appliedCoupon = candidateCoupon;
        savingsBreakdown.push({
          label: `Coupon: ${candidateCoupon.code} (${candidateCoupon.description})`,
          amountInPaise: discount,
          type: 'coupon',
        });
      } else {
        // Keep tier discount
        couponError = `Tier discounts give higher savings than coupon ${candidateCoupon.code}.`;
      }
    } else {
      couponDiscountInPaise = discount;
      appliedCoupon = candidateCoupon;
      if (discount > 0) {
        savingsBreakdown.push({
          label: `Coupon: ${candidateCoupon.code} (${candidateCoupon.description})`,
          amountInPaise: discount,
          type: 'coupon',
        });
      }
    }
  }

  // 7. Shipping calculation
  const isFreeShippingByThreshold =
    config?.freeShippingThresholdInPaise && subtotalInPaise >= config.freeShippingThresholdInPaise;

  const isShippingFree = tierShippingFree || Boolean(isFreeShippingByThreshold);
  const finalShippingFee = isShippingFree || subtotalInPaise === 0 ? 0 : shippingFeeInPaise;

  if (isShippingFree && subtotalInPaise > 0) {
    savingsBreakdown.push({
      label: 'Free Standard Delivery',
      amountInPaise: shippingFeeInPaise,
      type: 'tier',
    });
  }

  // 8. Totals aggregation
  const totalDirectDiscount = tierDiscountInPaise + bundleDiscountInPaise + couponDiscountInPaise;
  const grandTotalInPaise = Math.max(0, subtotalInPaise - totalDirectDiscount + finalShippingFee);

  // Total savings includes compare-at discounts + direct discounts + freebies value + saved shipping
  let totalSavingsInPaise = 0;
  for (const s of savingsBreakdown) {
    totalSavingsInPaise += s.amountInPaise;
  }

  // Full item list including regular items and current auto-added freebies
  const finalItems = [...regularItems, ...autoAddedFreebies];

  return {
    items: finalItems,
    itemCount: itemCount + autoAddedFreebies.length,
    subtotalInPaise,
    discountInPaise: totalDirectDiscount,
    shippingFeeInPaise: finalShippingFee,
    grandTotalInPaise,
    totalSavingsInPaise,
    savingsBreakdown,
    activeTiersReached,
    nextTier,
    autoAddedFreebies,
    appliedCoupon,
    couponError,
  };
}
