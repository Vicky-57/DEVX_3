import { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { calculateCartPricing, CartItem } from '@cartx/shared';

export async function cartRoutes(app: FastifyInstance) {
  app.post('/v1/cart/price', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      items: CartItem[];
      appliedCouponCode?: string;
      collectionId?: string;
    };

    const storeId = body.storeId || 'store_aura';
    const items = body.items || [];
    const appliedCouponCode = body.appliedCouponCode;

    // Load progress tiers
    const tiersRows = db
      .prepare('SELECT * FROM progress_tiers WHERE store_id = ? ORDER BY threshold_in_paise ASC')
      .all(storeId) as any[];

    const tiers = tiersRows.map((t) => ({
      id: t.id,
      thresholdInPaise: t.threshold_in_paise,
      rewardType: t.reward_type,
      rewardValue: t.reward_value,
      label: t.label,
      icon: t.icon,
      freeProductId: t.free_product_id,
    }));

    // Load freebie rules
    const freebieRows = db
      .prepare('SELECT * FROM freebie_rules WHERE store_id = ? AND active = 1')
      .all(storeId) as any[];

    const freebieRules = freebieRows.map((r) => ({
      id: r.id,
      storeId: r.store_id,
      minSpendInPaise: r.min_spend_in_paise,
      freeProductId: r.free_product_id,
      label: r.label,
      active: Boolean(r.active),
    }));

    // Load bundle offers
    const bundleRows = db
      .prepare('SELECT * FROM bundle_offers WHERE store_id = ? AND active = 1')
      .all(storeId) as any[];

    const bundleOffers = bundleRows.map((b) => ({
      id: b.id,
      storeId: b.store_id,
      title: b.title,
      triggerProductIds: JSON.parse(b.trigger_product_ids_json),
      discountedProductId: b.discounted_product_id,
      discountPercent: b.discount_percent,
      active: Boolean(b.active),
    }));

    // Load coupons
    const couponRows = db
      .prepare('SELECT * FROM coupons WHERE store_id = ? AND active = 1')
      .all(storeId) as any[];

    const coupons = couponRows.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      minSpendInPaise: c.min_spend_in_paise,
      maxDiscountInPaise: c.max_discount_in_paise,
      isStackable: Boolean(c.is_stackable),
      autoApply: Boolean(c.auto_apply),
      description: c.description,
      active: Boolean(c.active),
    }));

    // Load full catalog for item resolution
    const productsRows = db.prepare('SELECT * FROM products WHERE store_id = ?').all(storeId) as any[];
    const catalog = productsRows.map((p) => ({
      id: p.id,
      storeId: p.store_id,
      title: p.title,
      handle: p.handle,
      description: p.description,
      priceInPaise: p.price_in_paise,
      compareAtPriceInPaise: p.compare_at_price_in_paise,
      imageUrl: p.image_url,
      category: p.category,
      tags: JSON.parse(p.tags_json || '[]'),
      inventoryCount: p.inventory_count,
      isAvailable: Boolean(p.is_available),
    }));

    // Load cart config
    let configRow: any;
    if (body.collectionId) {
      configRow = db
        .prepare('SELECT * FROM cart_configs WHERE store_id = ? AND collection_id = ?')
        .get(storeId, body.collectionId);
    }
    if (!configRow) {
      configRow = db
        .prepare('SELECT * FROM cart_configs WHERE store_id = ? AND collection_id IS NULL')
        .get(storeId);
    }

    const config = configRow
      ? {
          id: configRow.id,
          storeId: configRow.store_id,
          name: configRow.name,
          collectionId: configRow.collection_id,
          modules: JSON.parse(configRow.modules_json),
          theme: JSON.parse(configRow.theme_json),
          defaultShippingFeeInPaise: configRow.default_shipping_fee_in_paise,
          freeShippingThresholdInPaise: configRow.free_shipping_threshold_in_paise,
          urgencyTimerMinutes: configRow.urgency_timer_minutes,
          urgencyBannerText: configRow.urgency_banner_text,
          showLowStockAlert: Boolean(configRow.show_low_stock_alert),
          lowStockThreshold: configRow.low_stock_threshold,
        }
      : undefined;

    // Run pure authoritative calculation
    const pricing = calculateCartPricing({
      items,
      tiers,
      freebieRules,
      bundleOffers,
      coupons,
      catalog,
      appliedCouponCode,
      shippingFeeInPaise: config?.defaultShippingFeeInPaise ?? 9900,
      config,
    });

    return reply.send(pricing);
  });
}
