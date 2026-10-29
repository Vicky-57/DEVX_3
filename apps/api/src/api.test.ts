import { describe, it, expect, beforeAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { initSchema, db } from './db.js';
import { runSeed } from './seed.js';
import { configRoutes } from './routes/config.js';
import { catalogRoutes } from './routes/catalog.js';
import { cartRoutes } from './routes/cart.js';
import { couponRoutes } from './routes/coupons.js';
import { checkoutRoutes } from './routes/checkout.js';
import { adminRoutes } from './routes/admin.js';
import { searchRoutes } from './routes/search.js';
import { retailOSRoutes } from './routes/retailos.js';

let app: FastifyInstance;

beforeAll(async () => {
  initSchema();
  runSeed();

  app = Fastify();
  await app.register(cors);
  await app.register(configRoutes);
  await app.register(catalogRoutes);
  await app.register(cartRoutes);
  await app.register(couponRoutes);
  await app.register(checkoutRoutes);
  await app.register(adminRoutes);
  await app.register(searchRoutes);
  await app.register(retailOSRoutes);
});

describe('CartX API Endpoints', () => {
  it('GET /v1/config returns store configuration, progress tiers and A/B variant', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/config?storeId=store_aura&visitorId=test_visitor_1',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.storeId).toBe('store_aura');
    expect(body.tiers.length).toBeGreaterThan(0);
    expect(body.cartConfig.modules.urgencyProgressTools).toBeDefined();
    expect(body.activeExperiment).toBeDefined();
    expect(body.activeExperiment.assignedVariantId).toBeDefined();
    expect(res.headers['etag']).toBeDefined();
  });

  it('GET /v1/products returns seeded catalog with prices in paise', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products?storeId=store_aura',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.products.length).toBeGreaterThanOrEqual(10);
    const first = body.products[0];
    expect(first.priceInPaise).toBeGreaterThan(0);
  });

  it('POST /v1/cart/price calculates authoritative total with auto-freebie tier', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/cart/price',
      payload: {
        storeId: 'store_aura',
        items: [
          {
            id: 'item_1',
            productId: 'prod_hoodie_acid',
            title: 'Acid Wash Heavy Fleece Hoodie',
            priceInPaise: 249900, // ₹2,499 (qualifies for free shipping & free tote)
            quantity: 1,
            imageUrl: '...',
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.subtotalInPaise).toBe(249900);
    expect(body.shippingFeeInPaise).toBe(0); // Free shipping unlocked
    expect(body.autoAddedFreebies.length).toBeGreaterThan(0);
    expect(body.autoAddedFreebies[0].isFreebie).toBe(true);
    expect(body.autoAddedFreebies[0].priceInPaise).toBe(0);
  });

  it('POST /v1/coupons/validate verifies valid coupon codes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/coupons/validate',
      payload: {
        storeId: 'store_aura',
        code: 'WELCOME10',
        subtotalInPaise: 150000,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.valid).toBe(true);
    expect(body.coupon.code).toBe('WELCOME10');
    expect(body.discountInPaise).toBe(15000); // 10% of 150000
  });

  it('POST /v1/checkout creates order and records analytics conversion', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/checkout',
      payload: {
        storeId: 'store_aura',
        visitorId: 'test_buyer_99',
        customerName: 'Ananya Roy',
        customerEmail: 'ananya@example.com',
        shippingAddress: 'Flat 302, Bandra West, Mumbai, MH',
        items: [
          { productId: 'prod_tee_heavy', title: 'Heavyweight Tee', priceInPaise: 129900, quantity: 1 },
        ],
        subtotalInPaise: 129900,
        discountInPaise: 0,
        shippingFeeInPaise: 0,
        totalInPaise: 129900,
        savingsInPaise: 9900,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.order.id).toMatch(/^ord_/);
    expect(body.order.status).toBe('paid');
  });

  it('GET /v1/admin/analytics computes conversion rate, AOV, and funnel progression', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/admin/analytics?storeId=store_aura',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.summary.conversionRatePct).toBeGreaterThan(0);
    expect(body.summary.avgOrderValuePaise).toBeGreaterThan(0);
    expect(body.funnel.length).toBe(4);
    expect(body.recentOrders.length).toBeGreaterThan(0);
  });
});

describe('SearchX API Endpoints', () => {
  it('GET /v1/search handles typo-tolerant search and intent extraction', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/search?storeId=store_aura&q=sneekers',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.query).toBe('sneekers');
    expect(body.intent.cleanQuery).toBe('sneekers');
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].product.tags).toContain('sneakers');
  });

  it('GET /v1/search parses price budget intent (e.g. under 2000)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/search?storeId=store_aura&q=pants under 2000',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.intent.maxPriceInPaise).toBe(200000);
    expect(body.items.length).toBeGreaterThan(0);
    for (const r of body.items) {
      expect(r.product.priceInPaise).toBeLessThanOrEqual(200000);
    }
  });

  it('POST /v1/search/analytics/click logs search interaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/search/analytics/click',
      payload: {
        storeId: 'store_aura',
        query: 'hoodie',
        productId: 'prod_hoodie_acid',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
  });

  it('GET /v1/admin/search/analytics returns query analytics & zero-result queries', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/admin/search/analytics?storeId=store_aura',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.summary.totalSearches).toBeGreaterThan(0);
    expect(body.topQueries.length).toBeGreaterThan(0);
    expect(Array.isArray(body.zeroResultQueries)).toBe(true);
  });
});

describe('RetailOS API Endpoints', () => {
  it('GET /v1/retail/locations returns active store locations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/retail/locations?storeId=store_aura',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.locations.length).toBeGreaterThanOrEqual(2);
    const flagship = body.locations.find((l: any) => l.id === 'loc_flagship');
    expect(flagship).toBeDefined();
    expect(flagship.name).toContain('Indiranagar');
  });

  it('GET /v1/retail/inventory returns stock levels for location', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/retail/inventory?storeId=store_aura&locationId=loc_flagship',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.inventory.length).toBeGreaterThan(0);
    expect(body.inventory[0].totalOnHand).toBeGreaterThanOrEqual(0);
  });

  it('POST /v1/retail/inventory/transfer transfers stock between warehouse and store', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/inventory/transfer',
      payload: {
        productId: 'prod_tee_heavy',
        fromLocationId: 'loc_online',
        toLocationId: 'loc_flagship',
        quantity: 2,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
  });

  it('GET /v1/retail/shifts/current returns active shift or opens one', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/retail/shifts/current?locationId=loc_flagship',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.activeShift).toBeDefined();
    expect(body.activeShift.status).toBe('open');
  });

  it('POST /v1/retail/pos/sale executes atomic sale with inventory deduction and drawer logging', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/pos/sale',
      payload: {
        storeId: 'store_aura',
        locationId: 'loc_flagship',
        staffId: 'staff_karan',
        staffName: 'Karan Mehta',
        customerName: 'Kunal Shah',
        customerPhone: '+91 98888 77777',
        items: [
          {
            productId: 'prod_beanie_ribbed',
            title: 'Ribbed Merino Beanie',
            priceInPaise: 79900,
            quantity: 1,
          },
        ],
        payments: [
          {
            type: 'cash',
            amountPaise: 79900,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.orderId).toBeDefined();
    expect(body.receipt.receiptNumber).toMatch(/^REC-/);
  });

  it('GET /v1/retail/bopis returns click & collect orders and PUT updates pickup status', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/retail/bopis?locationId=loc_flagship',
    });

    expect(listRes.statusCode).toBe(200);
    const listBody = JSON.parse(listRes.payload);
    expect(listBody.bopisOrders.length).toBeGreaterThan(0);
    const firstOrder = listBody.bopisOrders[0];

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/v1/retail/bopis/${firstOrder.order_id}/status`,
      payload: {
        status: 'ready',
      },
    });

    expect(updateRes.statusCode).toBe(200);
    const updateBody = JSON.parse(updateRes.payload);
    expect(updateBody.success).toBe(true);
  });

  it('POST /v1/retail/returns executes BORIS return restocking inventory', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/returns',
      payload: {
        storeId: 'store_aura',
        locationId: 'loc_flagship',
        orderId: 'ord_ctrl_1',
        returnedItems: [
          {
            productId: 'prod_tee_heavy',
            title: 'Aura Heavyweight Boxy Tee',
            quantity: 1,
            priceInPaise: 129900,
          },
        ],
        reason: 'wrong_size',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.returnId).toMatch(/^ret_/);
  });

  it('GET /v1/retail/customers/:id/360 returns omnichannel unified profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/retail/customers/cust_arjun/360',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.customer.name).toBe('Arjun Kapoor');
    expect(body.customer.loyaltyTier).toBe('Platinum');
    expect(body.customer.totalSpendPaise).toBeGreaterThan(0);
    expect(body.customer.aiRecommendations.length).toBeGreaterThan(0);
  });
});
