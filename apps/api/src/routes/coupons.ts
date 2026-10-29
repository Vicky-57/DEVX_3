import { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export async function couponRoutes(app: FastifyInstance) {
  app.post('/v1/coupons/validate', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      code: string;
      subtotalInPaise: number;
    };

    const storeId = body.storeId || 'store_aura';
    const code = (body.code || '').trim().toUpperCase();
    const subtotal = body.subtotalInPaise || 0;

    const row = db
      .prepare('SELECT * FROM coupons WHERE store_id = ? AND UPPER(code) = ?')
      .get(storeId, code) as any;

    if (!row) {
      return reply.status(400).send({
        valid: false,
        error: `Coupon "${code}" not found.`,
      });
    }

    if (!row.active) {
      return reply.status(400).send({
        valid: false,
        error: `Coupon "${code}" has expired.`,
      });
    }

    if (subtotal < row.min_spend_in_paise) {
      const minSpendRs = row.min_spend_in_paise / 100;
      return reply.status(400).send({
        valid: false,
        error: `Minimum spend of ₹${minSpendRs} required for this coupon.`,
      });
    }

    let discountInPaise = 0;
    if (row.type === 'percentage') {
      discountInPaise = Math.round(subtotal * (row.value / 100));
    } else if (row.type === 'fixed_amount') {
      discountInPaise = row.value;
    }

    if (row.max_discount_in_paise && discountInPaise > row.max_discount_in_paise) {
      discountInPaise = row.max_discount_in_paise;
    }

    return reply.send({
      valid: true,
      coupon: {
        id: row.id,
        code: row.code,
        type: row.type,
        value: row.value,
        minSpendInPaise: row.min_spend_in_paise,
        maxDiscountInPaise: row.max_discount_in_paise,
        isStackable: Boolean(row.is_stackable),
        autoApply: Boolean(row.auto_apply),
        description: row.description,
      },
      discountInPaise,
    });
  });
}
