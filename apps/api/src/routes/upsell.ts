import { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { getUpsellRecommendations, CartItem } from '@cartx/shared';

export async function upsellRoutes(app: FastifyInstance) {
  app.post('/v1/upsells', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      items: CartItem[];
      limit?: number;
    };

    const storeId = body.storeId || 'store_aura';
    const items = body.items || [];
    const limit = body.limit || 4;

    // Load catalog
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

    // Load upsell rules
    const ruleRows = db.prepare('SELECT * FROM upsell_rules WHERE store_id = ?').all(storeId) as any[];
    const rules = ruleRows.map((r) => ({
      id: r.id,
      storeId: r.store_id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      targetProductIds: JSON.parse(r.target_product_ids_json),
      isPinned: Boolean(r.is_pinned),
      isHidden: Boolean(r.is_hidden),
      customDiscountPct: r.custom_discount_pct,
      badgeText: r.badge_text,
    }));

    const recommendations = getUpsellRecommendations(items, catalog, rules, limit);

    return reply.send({ recommendations });
  });
}
