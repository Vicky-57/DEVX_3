import { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import crypto from 'node:crypto';

export async function checkoutRoutes(app: FastifyInstance) {
  app.post('/v1/checkout', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      visitorId: string;
      experimentId?: string;
      variantId?: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      shippingAddress: string;
      items: any[];
      subtotalInPaise: number;
      discountInPaise: number;
      shippingFeeInPaise: number;
      totalInPaise: number;
      savingsInPaise: number;
      appliedCouponCode?: string;
      paymentMethod?: string;
    };

    const storeId = body.storeId || 'store_aura';
    const orderId = `ord_${crypto.randomUUID().slice(0, 8)}`;

    // Insert order
    db.prepare(`
      INSERT INTO orders (
        id, store_id, visitor_id, experiment_id, variant_id, customer_name,
        customer_email, customer_phone, shipping_address, items_json,
        subtotal_in_paise, discount_in_paise, shipping_fee_in_paise, total_in_paise,
        savings_in_paise, applied_coupon_code, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')
    `).run(
      orderId,
      storeId,
      body.visitorId,
      body.experimentId || null,
      body.variantId || null,
      body.customerName || 'Guest Customer',
      body.customerEmail || 'customer@example.com',
      body.customerPhone || null,
      body.shippingAddress || '101 MG Road, Bengaluru, KA',
      JSON.stringify(body.items || []),
      body.subtotalInPaise || 0,
      body.discountInPaise || 0,
      body.shippingFeeInPaise || 0,
      body.totalInPaise || 0,
      body.savingsInPaise || 0,
      body.appliedCouponCode || null,
      body.paymentMethod || 'upi'
    );

    // Record checkout_completed event for A/B testing conversion attribution
    db.prepare(`
      INSERT INTO analytics_events (
        store_id, event_name, visitor_id, session_id, experiment_id, variant_id, metadata_json
      ) VALUES (?, 'checkout_completed', ?, ?, ?, ?, ?)
    `).run(
      storeId,
      body.visitorId,
      `session_${body.visitorId}`,
      body.experimentId || null,
      body.variantId || null,
      JSON.stringify({
        orderId,
        totalInPaise: body.totalInPaise,
        itemCount: body.items?.length || 0,
      })
    );

    return reply.send({
      success: true,
      order: {
        id: orderId,
        totalInPaise: body.totalInPaise,
        status: 'paid',
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        createdAt: new Date().toISOString(),
      },
    });
  });
}
