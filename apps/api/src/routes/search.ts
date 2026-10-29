import { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { executeSearchX, SearchMerchandisingRule, SearchSynonym } from '@cartx/shared';

export async function searchRoutes(app: FastifyInstance) {
  // Public search discovery endpoint
  app.get('/v1/search', async (request, reply) => {
    const query = request.query as {
      q?: string;
      storeId?: string;
      category?: string;
      minPrice?: string;
      maxPrice?: string;
      limit?: string;
    };

    const storeId = query.storeId || 'store_aura';
    const rawQ = (query.q || '').trim();
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    // 1. Fetch catalog
    const productRows = db
      .prepare('SELECT * FROM products WHERE store_id = ? AND is_available = 1')
      .all(storeId) as any[];

    const catalog = productRows.map((p) => ({
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

    // 2. Fetch active synonyms
    const synRows = db
      .prepare('SELECT * FROM search_synonyms WHERE store_id = ? AND active = 1')
      .all(storeId) as any[];

    const synonyms: SearchSynonym[] = synRows.map((s) => ({
      id: s.id,
      storeId: s.store_id,
      triggerWord: s.trigger_word,
      replacementWords: JSON.parse(s.replacement_words_json || '[]'),
      active: Boolean(s.active),
    }));

    // 3. Fetch active merchandising rules
    const ruleRows = db
      .prepare('SELECT * FROM search_merchandising_rules WHERE store_id = ? AND active = 1')
      .all(storeId) as any[];

    const merchandisingRules: SearchMerchandisingRule[] = ruleRows.map((r) => ({
      id: r.id,
      storeId: r.store_id,
      query: r.query,
      pinnedProductIds: JSON.parse(r.pinned_product_ids_json || '[]'),
      boostedTags: JSON.parse(r.boosted_tags_json || '[]'),
      buriedProductIds: JSON.parse(r.buried_product_ids_json || '[]'),
      active: Boolean(r.active),
    }));

    const result = executeSearchX(rawQ, catalog, {
      synonyms,
      merchandisingRules,
      categoryFilter: query.category,
      minPricePaise: query.minPrice ? parseInt(query.minPrice, 10) * 100 : undefined,
      maxPricePaise: query.maxPrice ? parseInt(query.maxPrice, 10) * 100 : undefined,
      limit,
    });

    // Asynchronously log search query for analytics
    if (rawQ.length >= 2) {
      db.prepare(`
        INSERT INTO search_queries_log (store_id, query, results_count, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(storeId, rawQ.toLowerCase(), result.total);
    }

    return reply.send(result);
  });

  // Track click on search result item for CTR
  app.post('/v1/search/analytics/click', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      query: string;
      productId: string;
    };

    if (body.query && body.productId) {
      db.prepare(`
        UPDATE search_queries_log
        SET clicked_product_id = ?
        WHERE id = (
          SELECT id FROM search_queries_log
          WHERE query = ?
          ORDER BY id DESC LIMIT 1
        )
      `).run(body.productId, body.query.toLowerCase().trim());
    }

    return reply.send({ success: true });
  });

  // Admin Search Analytics Report
  app.get('/v1/admin/search/analytics', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';

    // Top search queries
    const topQueries = db
      .prepare(`
        SELECT
          query,
          COUNT(*) as search_count,
          AVG(results_count) as avg_results,
          SUM(CASE WHEN clicked_product_id IS NOT NULL THEN 1 ELSE 0 END) as clicks
        FROM search_queries_log
        WHERE store_id = ?
        GROUP BY query
        ORDER BY search_count DESC
        LIMIT 10
      `)
      .all(storeId) as any[];

    // Zero-result queries (opportunities to stock or add synonyms)
    const zeroResultQueries = db
      .prepare(`
        SELECT query, COUNT(*) as count, MAX(created_at) as last_searched
        FROM search_queries_log
        WHERE store_id = ? AND results_count = 0
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
      `)
      .all(storeId);

    // Summary totals
    const totalStats = db
      .prepare(`
        SELECT
          COUNT(*) as total_searches,
          SUM(CASE WHEN clicked_product_id IS NOT NULL THEN 1 ELSE 0 END) as total_clicks
        FROM search_queries_log
        WHERE store_id = ?
      `)
      .get(storeId) as any;

    const totalSearches = totalStats?.total_searches || 0;
    const totalClicks = totalStats?.total_clicks || 0;
    const ctrPct = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0;

    return reply.send({
      summary: {
        totalSearches,
        totalClicks,
        ctrPct: parseFloat(ctrPct.toFixed(2)),
      },
      topQueries: topQueries.map((q) => ({
        ...q,
        ctrPct: q.search_count > 0 ? parseFloat(((q.clicks / q.search_count) * 100).toFixed(1)) : 0,
      })),
      zeroResultQueries,
    });
  });

  // Synonyms CRUD
  app.get('/v1/admin/search/synonyms', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const rows = db.prepare('SELECT * FROM search_synonyms WHERE store_id = ?').all(storeId) as any[];
    return reply.send({
      synonyms: rows.map((r) => ({
        id: r.id,
        storeId: r.store_id,
        triggerWord: r.trigger_word,
        replacementWords: JSON.parse(r.replacement_words_json || '[]'),
        active: Boolean(r.active),
      })),
    });
  });

  app.post('/v1/admin/search/synonyms', async (request, reply) => {
    const body = request.body as any;
    const storeId = body.storeId || 'store_aura';
    const id = body.id || `syn_${Date.now()}`;

    db.prepare(`
      INSERT INTO search_synonyms (id, store_id, trigger_word, replacement_words_json, active)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      storeId,
      body.triggerWord.toLowerCase().trim(),
      JSON.stringify(body.replacementWords || []),
      body.active ? 1 : 0
    );

    return reply.send({ success: true, id });
  });

  app.delete('/v1/admin/search/synonyms/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare('DELETE FROM search_synonyms WHERE id = ?').run(id);
    return reply.send({ success: true });
  });

  // Merchandising Rules CRUD
  app.get('/v1/admin/search/merchandising', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const rows = db
      .prepare('SELECT * FROM search_merchandising_rules WHERE store_id = ?')
      .all(storeId) as any[];
    return reply.send({
      rules: rows.map((r) => ({
        id: r.id,
        storeId: r.store_id,
        query: r.query,
        pinnedProductIds: JSON.parse(r.pinned_product_ids_json || '[]'),
        boostedTags: JSON.parse(r.boosted_tags_json || '[]'),
        buriedProductIds: JSON.parse(r.buried_product_ids_json || '[]'),
        active: Boolean(r.active),
      })),
    });
  });

  app.post('/v1/admin/search/merchandising', async (request, reply) => {
    const body = request.body as any;
    const storeId = body.storeId || 'store_aura';
    const id = body.id || `rule_search_${Date.now()}`;

    db.prepare(`
      INSERT INTO search_merchandising_rules (
        id, store_id, query, pinned_product_ids_json, boosted_tags_json, buried_product_ids_json, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      storeId,
      body.query.toLowerCase().trim(),
      JSON.stringify(body.pinnedProductIds || []),
      JSON.stringify(body.boostedTags || []),
      JSON.stringify(body.buriedProductIds || []),
      body.active ? 1 : 0
    );

    return reply.send({ success: true, id });
  });

  app.delete('/v1/admin/search/merchandising/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    db.prepare('DELETE FROM search_merchandising_rules WHERE id = ?').run(id);
    return reply.send({ success: true });
  });
}
