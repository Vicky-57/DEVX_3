import { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/v1/products', async (request, reply) => {
    const query = request.query as {
      storeId?: string;
      collectionId?: string;
      category?: string;
    };

    const storeId = query.storeId || 'store_aura';

    let sql = `
      SELECT p.*
      FROM products p
    `;

    const params: any[] = [storeId];

    if (query.collectionId) {
      sql += `
        JOIN product_collections pc ON p.id = pc.product_id
        WHERE p.store_id = ? AND pc.collection_id = ? AND p.is_available = 1
      `;
      params.push(query.collectionId);
    } else if (query.category) {
      sql += `
        WHERE p.store_id = ? AND p.category = ? AND p.is_available = 1
      `;
      params.push(query.category);
    } else {
      sql += `
        WHERE p.store_id = ? AND p.is_available = 1
      `;
    }

    sql += ' ORDER BY p.price_in_paise DESC';

    const rows = db.prepare(sql).all(...params) as any[];

    const products = rows.map((p) => ({
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
      createdAt: p.created_at,
    }));

    return reply.send({ products });
  });

  app.get('/v1/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;

    if (!p) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    return reply.send({
      product: {
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
        createdAt: p.created_at,
      },
    });
  });

  app.get('/v1/collections', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';

    const collections = db
      .prepare('SELECT * FROM collections WHERE store_id = ?')
      .all(storeId) as any[];

    return reply.send({
      collections: collections.map((c) => ({
        id: c.id,
        storeId: c.store_id,
        title: c.title,
        handle: c.handle,
        description: c.description,
        bannerImageUrl: c.banner_image_url,
      })),
    });
  });
}
