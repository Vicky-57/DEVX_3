import { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { assignVariant } from '@cartx/shared';
import crypto from 'node:crypto';

export async function configRoutes(app: FastifyInstance) {
  app.get('/v1/config', async (request, reply) => {
    const query = request.query as {
      storeId?: string;
      collectionId?: string;
      visitorId?: string;
    };

    const storeId = query.storeId || 'store_aura';
    const collectionId = query.collectionId;
    const visitorId = query.visitorId || 'guest_default';

    // 1. Fetch Cart Config (collection-specific or default fallback)
    let configRow: any;
    if (collectionId) {
      configRow = db
        .prepare('SELECT * FROM cart_configs WHERE store_id = ? AND collection_id = ?')
        .get(storeId, collectionId);
    }
    if (!configRow) {
      configRow = db
        .prepare('SELECT * FROM cart_configs WHERE store_id = ? AND collection_id IS NULL')
        .get(storeId);
    }
    if (!configRow) {
      return reply.status(404).send({ error: 'Store configuration not found' });
    }

    const modules = JSON.parse(configRow.modules_json);
    const theme = JSON.parse(configRow.theme_json);

    // 2. Fetch Active Progress Tiers
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

    // 3. Fetch Freebie Rules
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

    // 4. Fetch Bundle Offers
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

    // 5. Fetch Active Coupons
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

    // 6. Handle A/B Testing Variant Assignment
    let activeExperiment: any = null;
    let assignedVariant: any = null;

    if (modules.abTesting) {
      const expRow = db
        .prepare("SELECT * FROM experiments WHERE store_id = ? AND status = 'running' LIMIT 1")
        .get(storeId) as any;

      if (expRow) {
        const variants = JSON.parse(expRow.variants_json);
        const expObj = {
          id: expRow.id,
          storeId: expRow.store_id,
          name: expRow.name,
          status: expRow.status,
          variants,
          createdAt: expRow.created_at,
        };

        assignedVariant = assignVariant(visitorId, expObj);
        activeExperiment = {
          id: expRow.id,
          name: expRow.name,
          assignedVariantId: assignedVariant.id,
          variantName: assignedVariant.name,
        };

        // Apply variant config overrides if present
        if (assignedVariant.configOverride?.modules) {
          Object.assign(modules, assignedVariant.configOverride.modules);
        }
      }
    }

    const payload = {
      storeId,
      cartConfig: {
        id: configRow.id,
        name: configRow.name,
        collectionId: configRow.collection_id,
        modules,
        theme,
        defaultShippingFeeInPaise: configRow.default_shipping_fee_in_paise,
        freeShippingThresholdInPaise: configRow.free_shipping_threshold_in_paise,
        urgencyTimerMinutes: configRow.urgency_timer_minutes,
        urgencyBannerText: configRow.urgency_banner_text,
        collectionBannerHeadline: configRow.collection_banner_headline,
        collectionBannerSubline: configRow.collection_banner_subline,
        showLowStockAlert: Boolean(configRow.show_low_stock_alert),
        lowStockThreshold: configRow.low_stock_threshold,
      },
      tiers,
      freebieRules,
      bundleOffers,
      coupons,
      activeExperiment,
    };

    // Calculate ETag for caching
    const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');
    reply.header('ETag', `"${hash}"`);
    reply.header('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');

    if (request.headers['if-none-match'] === `"${hash}"`) {
      return reply.status(304).send();
    }

    return reply.send(payload);
  });
}
