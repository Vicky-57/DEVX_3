import { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export async function adminRoutes(app: FastifyInstance) {
  // 1. Merchant Analytics Dashboard Overview
  app.get('/v1/admin/analytics', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';

    // Funnel counts from analytics_events
    const eventCountsRows = db
      .prepare(`
        SELECT event_name, COUNT(DISTINCT visitor_id) as unique_visitors, COUNT(*) as total_events
        FROM analytics_events
        WHERE store_id = ?
        GROUP BY event_name
      `)
      .all(storeId) as any[];

    const funnelMap: Record<string, number> = {};
    for (const r of eventCountsRows) {
      funnelMap[r.event_name] = r.unique_visitors;
    }

    const cartOpens = funnelMap['cart_opened'] || 0;
    const itemsAdded = funnelMap['item_added'] || 0;
    const tiersReached = funnelMap['tier_unlocked'] || 0;
    const checkoutsCompleted = funnelMap['checkout_completed'] || 0;
    const upsellClicks = funnelMap['upsell_clicked'] || 0;

    const conversionRate = cartOpens > 0 ? (checkoutsCompleted / cartOpens) * 100 : 0;

    // Order totals & AOV
    const orderStats = db
      .prepare(`
        SELECT
          COUNT(*) as order_count,
          SUM(total_in_paise) as total_revenue_paise,
          SUM(savings_in_paise) as total_savings_paise,
          AVG(total_in_paise) as avg_order_value_paise
        FROM orders
        WHERE store_id = ?
      `)
      .get(storeId) as any;

    const totalRevenuePaise = orderStats.total_revenue_paise || 0;
    const totalOrders = orderStats.order_count || 0;
    const aovPaise = orderStats.avg_order_value_paise || 0;
    const totalSavingsPaise = orderStats.total_savings_paise || 0;

    // Recent 10 orders
    const recentOrders = db
      .prepare(`
        SELECT id, customer_name, customer_email, total_in_paise, savings_in_paise,
               applied_coupon_code, variant_id, created_at
        FROM orders
        WHERE store_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `)
      .all(storeId);

    return reply.send({
      summary: {
        cartOpens,
        itemsAdded,
        tiersReached,
        upsellClicks,
        checkoutsCompleted,
        conversionRatePct: parseFloat(conversionRate.toFixed(2)),
        totalOrders,
        totalRevenuePaise,
        totalSavingsPaise,
        avgOrderValuePaise: Math.round(aovPaise),
      },
      funnel: [
        { stage: 'Cart Opened', count: cartOpens, dropoffPct: 0 },
        {
          stage: 'Items Added',
          count: itemsAdded,
          dropoffPct: cartOpens > 0 ? Math.round(((cartOpens - itemsAdded) / cartOpens) * 100) : 0,
        },
        {
          stage: 'Milestone Unlocked',
          count: tiersReached,
          dropoffPct: itemsAdded > 0 ? Math.round(((itemsAdded - tiersReached) / itemsAdded) * 100) : 0,
        },
        {
          stage: 'Checkout Complete',
          count: checkoutsCompleted,
          dropoffPct: itemsAdded > 0 ? Math.round(((itemsAdded - checkoutsCompleted) / itemsAdded) * 100) : 0,
        },
      ],
      recentOrders,
    });
  });

  // 2. A/B Experiment Performance Results
  app.get('/v1/admin/experiments/:id/results', async (request, reply) => {
    const { id } = request.params as { id: string };
    const expRow = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id) as any;

    if (!expRow) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    const variants = JSON.parse(expRow.variants_json);

    const variantResults = variants.map((v: any) => {
      // Unique visitors exposed to this variant
      const visitorCount = db
        .prepare(`
          SELECT COUNT(DISTINCT visitor_id) as count
          FROM analytics_events
          WHERE experiment_id = ? AND variant_id = ? AND event_name = 'cart_opened'
        `)
        .get(id, v.id) as any;

      // Conversions and revenue for this variant
      const orderStats = db
        .prepare(`
          SELECT
            COUNT(*) as conversions,
            SUM(total_in_paise) as total_revenue,
            AVG(total_in_paise) as avg_order_value
          FROM orders
          WHERE experiment_id = ? AND variant_id = ?
        `)
        .get(id, v.id) as any;

      const visitors = visitorCount.count || 0;
      const conversions = orderStats.conversions || 0;
      const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0;
      const aovPaise = orderStats.avg_order_value || 0;
      const totalRevenuePaise = orderStats.total_revenue || 0;

      return {
        variantId: v.id,
        name: v.name,
        trafficPct: v.trafficPct,
        visitors,
        conversions,
        conversionRatePct: parseFloat(conversionRate.toFixed(2)),
        avgOrderValuePaise: Math.round(aovPaise),
        totalRevenuePaise,
      };
    });

    // Compute relative lift between Variant 1 and Variant 0 if at least 2 variants
    let relativeConversionLiftPct = 0;
    let relativeAovLiftPct = 0;

    if (variantResults.length >= 2 && variantResults[0].conversionRatePct > 0) {
      const crControl = variantResults[0].conversionRatePct;
      const crTest = variantResults[1].conversionRatePct;
      relativeConversionLiftPct = parseFloat((((crTest - crControl) / crControl) * 100).toFixed(1));

      const aovControl = variantResults[0].avgOrderValuePaise;
      const aovTest = variantResults[1].avgOrderValuePaise;
      if (aovControl > 0) {
        relativeAovLiftPct = parseFloat((((aovTest - aovControl) / aovControl) * 100).toFixed(1));
      }
    }

    return reply.send({
      experiment: {
        id: expRow.id,
        name: expRow.name,
        status: expRow.status,
        description: expRow.description,
      },
      variantResults,
      lift: {
        conversionLiftPct: relativeConversionLiftPct,
        aovLiftPct: relativeAovLiftPct,
        winner: relativeConversionLiftPct > 0 ? variantResults[1].name : variantResults[0].name,
      },
    });
  });

  // 3. Tiers CRUD
  app.get('/v1/admin/tiers', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const tiers = db
      .prepare('SELECT * FROM progress_tiers WHERE store_id = ? ORDER BY threshold_in_paise ASC')
      .all(storeId);
    return reply.send({ tiers });
  });

  app.post('/v1/admin/tiers', async (request, reply) => {
    const body = request.body as any;
    const storeId = body.storeId || 'store_aura';
    const id = body.id || `tier_${Date.now()}`;

    db.prepare(`
      INSERT INTO progress_tiers (
        id, store_id, threshold_in_paise, reward_type, reward_value, label, icon, free_product_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      storeId,
      body.thresholdInPaise,
      body.rewardType,
      body.rewardValue || 0,
      body.label,
      body.icon || 'gift',
      body.freeProductId || null
    );

    return reply.send({ success: true, id });
  });

  app.delete('/v1/admin/tiers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare('DELETE FROM progress_tiers WHERE id = ?').run(id);
    return reply.send({ success: true });
  });

  // 4. Freebie Rules CRUD
  app.get('/v1/admin/freebies', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const freebies = db.prepare('SELECT * FROM freebie_rules WHERE store_id = ?').all(storeId);
    return reply.send({ freebies });
  });

  app.post('/v1/admin/freebies', async (request, reply) => {
    const body = request.body as any;
    const storeId = body.storeId || 'store_aura';
    const id = body.id || `rule_${Date.now()}`;

    db.prepare(`
      INSERT INTO freebie_rules (id, store_id, min_spend_in_paise, free_product_id, label, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, storeId, body.minSpendInPaise, body.freeProductId, body.label, body.active ? 1 : 0);

    return reply.send({ success: true, id });
  });

  // 5. Coupons CRUD
  app.get('/v1/admin/coupons', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const coupons = db.prepare('SELECT * FROM coupons WHERE store_id = ?').all(storeId);
    return reply.send({ coupons });
  });

  app.post('/v1/admin/coupons', async (request, reply) => {
    const body = request.body as any;
    const storeId = body.storeId || 'store_aura';
    const id = body.id || `coup_${Date.now()}`;

    db.prepare(`
      INSERT INTO coupons (
        id, store_id, code, type, value, min_spend_in_paise, max_discount_in_paise, is_stackable, auto_apply, description, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      storeId,
      body.code.trim().toUpperCase(),
      body.type,
      body.value,
      body.minSpendInPaise || 0,
      body.maxDiscountInPaise || null,
      body.isStackable ? 1 : 0,
      body.autoApply ? 1 : 0,
      body.description || '',
      body.active ? 1 : 0
    );

    return reply.send({ success: true, id });
  });

  // 6. Upsell Rules CRUD
  app.get('/v1/admin/upsells', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const rules = db.prepare('SELECT * FROM upsell_rules WHERE store_id = ?').all(storeId) as any[];
    return reply.send({
      rules: rules.map((r) => ({
        id: r.id,
        storeId: r.store_id,
        sourceType: r.source_type,
        sourceId: r.source_id,
        targetProductIds: JSON.parse(r.target_product_ids_json || '[]'),
        isPinned: Boolean(r.is_pinned),
        isHidden: Boolean(r.is_hidden),
        customDiscountPct: r.custom_discount_pct,
        badgeText: r.badge_text,
      })),
    });
  });

  app.post('/v1/admin/upsells', async (request, reply) => {
    const body = request.body as any;
    const storeId = body.storeId || 'store_aura';
    const id = body.id || `upsell_${Date.now()}`;

    db.prepare(`
      INSERT INTO upsell_rules (
        id, store_id, source_type, source_id, target_product_ids_json, is_pinned, is_hidden, custom_discount_pct, badge_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      storeId,
      body.sourceType || 'global',
      body.sourceId || null,
      JSON.stringify(body.targetProductIds || []),
      body.isPinned ? 1 : 0,
      body.isHidden ? 1 : 0,
      body.customDiscountPct || null,
      body.badgeText || null
    );

    return reply.send({ success: true, id });
  });

  // 7. Cart Theme & Config Update
  app.put('/v1/admin/config', async (request, reply) => {
    const body = request.body as any;
    const configId = body.id || 'cfg_default';

    db.prepare(`
      UPDATE cart_configs
      SET
        modules_json = ?,
        theme_json = ?,
        free_shipping_threshold_in_paise = ?,
        urgency_timer_minutes = ?,
        urgency_banner_text = ?,
        collection_banner_headline = ?,
        collection_banner_subline = ?
      WHERE id = ?
    `).run(
      JSON.stringify(body.modules),
      JSON.stringify(body.theme),
      body.freeShippingThresholdInPaise,
      body.urgencyTimerMinutes,
      body.urgencyBannerText,
      body.collectionBannerHeadline,
      body.collectionBannerSubline,
      configId
    );

    return reply.send({ success: true });
  });
}
