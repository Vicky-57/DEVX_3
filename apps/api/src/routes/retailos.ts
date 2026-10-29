import { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import crypto from 'node:crypto';

export async function retailOSRoutes(app: FastifyInstance) {
  // 1. Locations
  app.get('/v1/retail/locations', async (request, reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId || 'store_aura';

    const locations = db
      .prepare('SELECT * FROM locations WHERE store_id = ? AND is_active = 1')
      .all(storeId) as any[];

    return reply.send({ locations });
  });

  // 2. Multi-Location Inventory Matrix
  app.get('/v1/retail/inventory', async (request, reply) => {
    const query = request.query as { storeId?: string; locationId?: string };
    const storeId = query.storeId || 'store_aura';

    const products = db
      .prepare('SELECT id, title, price_in_paise, image_url, category FROM products WHERE store_id = ?')
      .all(storeId) as any[];

    const locations = db
      .prepare('SELECT id, name, type FROM locations WHERE store_id = ?')
      .all(storeId) as any[];

    const inventoryRows = db
      .prepare(`
        SELECT li.*, l.name as location_name, l.type as location_type
        FROM location_inventory li
        JOIN locations l ON li.location_id = l.id
        WHERE l.store_id = ?
      `)
      .all(storeId) as any[];

    const matrix = products.map((p) => {
      const locStocks = locations.map((loc) => {
        const inv = inventoryRows.find(
          (r) => r.product_id === p.id && r.location_id === loc.id
        );
        const onHand = inv ? inv.on_hand : 0;
        const reserved = inv ? inv.reserved : 0;
        return {
          locationId: loc.id,
          locationName: loc.name,
          locationType: loc.type,
          onHand,
          reserved,
          available: Math.max(0, onHand - reserved),
          reorderLevel: inv ? inv.reorder_level : 10,
        };
      });

      const totalOnHand = locStocks.reduce((sum, s) => sum + s.onHand, 0);
      const totalAvailable = locStocks.reduce((sum, s) => sum + s.available, 0);
      const totalReserved = locStocks.reduce((sum, s) => sum + s.reserved, 0);

      return {
        product: p,
        totalOnHand,
        totalAvailable,
        totalReserved,
        locations: locStocks,
      };
    });

    return reply.send({ inventory: matrix });
  });

  // 3. Stock Transfer between locations
  app.post('/v1/retail/inventory/transfer', async (request, reply) => {
    const body = request.body as {
      productId: string;
      fromLocationId: string;
      toLocationId: string;
      quantity: number;
    };

    if (body.quantity <= 0) {
      return reply.status(400).send({ error: 'Quantity must be positive' });
    }

    const transferTx = db.transaction(() => {
      const fromStock = db
        .prepare('SELECT on_hand, reserved FROM location_inventory WHERE location_id = ? AND product_id = ?')
        .get(body.fromLocationId, body.productId) as any;

      if (!fromStock || (fromStock.on_hand - fromStock.reserved) < body.quantity) {
        throw new Error('Insufficient available stock at source location');
      }

      // Deduct from source
      db.prepare(`
        UPDATE location_inventory
        SET on_hand = on_hand - ?
        WHERE location_id = ? AND product_id = ?
      `).run(body.quantity, body.fromLocationId, body.productId);

      // Add to destination
      db.prepare(`
        INSERT INTO location_inventory (location_id, product_id, on_hand, reserved, reorder_level)
        VALUES (?, ?, ?, 0, 10)
        ON CONFLICT(location_id, product_id) DO UPDATE SET on_hand = on_hand + excluded.on_hand
      `).run(body.toLocationId, body.productId, body.quantity);
    });

    try {
      transferTx();
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // 4. Current Shift & Cash Drawer Status
  app.get('/v1/retail/shifts/current', async (request, reply) => {
    const query = request.query as { locationId: string };
    const shift = db
      .prepare("SELECT * FROM store_shifts WHERE location_id = ? AND status = 'open' ORDER BY opened_at DESC LIMIT 1")
      .get(query.locationId) as any;

    if (!shift) {
      return reply.send({ activeShift: null });
    }

    const logs = db
      .prepare('SELECT * FROM cash_drawer_logs WHERE shift_id = ? ORDER BY created_at DESC')
      .all(shift.id);

    return reply.send({
      activeShift: shift,
      logs,
    });
  });

  // 5. Open Shift
  app.post('/v1/retail/shifts/open', async (request, reply) => {
    const body = request.body as {
      locationId: string;
      staffId: string;
      staffName: string;
      openingFloatPaise: number;
    };

    // Check if open shift already exists
    const existing = db
      .prepare("SELECT id FROM store_shifts WHERE location_id = ? AND status = 'open'")
      .get(body.locationId);

    if (existing) {
      return reply.status(400).send({ error: 'A shift is already open for this location.' });
    }

    const shiftId = `shift_${Date.now()}`;
    const openingFloat = body.openingFloatPaise || 500000; // ₹5,000 default

    db.prepare(`
      INSERT INTO store_shifts (
        id, location_id, staff_id, staff_name, opening_float_paise, expected_cash_paise, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'open')
    `).run(shiftId, body.locationId, body.staffId, body.staffName, openingFloat, openingFloat);

    db.prepare(`
      INSERT INTO cash_drawer_logs (id, shift_id, type, amount_paise, reason)
      VALUES (?, ?, 'opening_float', ?, 'Shift Opening Cash Float')
    `).run(`log_${Date.now()}`, shiftId, openingFloat);

    return reply.send({ success: true, shiftId });
  });

  // 6. Cash Drop or Pickup
  app.post('/v1/retail/shifts/log', async (request, reply) => {
    const body = request.body as {
      shiftId: string;
      type: 'drop' | 'pickup';
      amountPaise: number;
      reason: string;
    };

    const delta = body.type === 'drop' ? -body.amountPaise : body.amountPaise;

    db.prepare(`
      INSERT INTO cash_drawer_logs (id, shift_id, type, amount_paise, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(`log_${Date.now()}`, body.shiftId, body.type, body.amountPaise, body.reason);

    db.prepare(`
      UPDATE store_shifts
      SET expected_cash_paise = expected_cash_paise + ?
      WHERE id = ?
    `).run(delta, body.shiftId);

    return reply.send({ success: true });
  });

  // 7. Close Shift & Reconcile
  app.post('/v1/retail/shifts/close', async (request, reply) => {
    const body = request.body as {
      shiftId: string;
      actualCashPaise: number;
    };

    const shift = db.prepare('SELECT * FROM store_shifts WHERE id = ?').get(body.shiftId) as any;
    if (!shift || shift.status !== 'open') {
      return reply.status(400).send({ error: 'Active shift not found' });
    }

    const discrepancy = body.actualCashPaise - shift.expected_cash_paise;

    db.prepare(`
      UPDATE store_shifts
      SET
        closed_at = datetime('now'),
        actual_cash_paise = ?,
        discrepancy_paise = ?,
        status = 'closed'
      WHERE id = ?
    `).run(body.actualCashPaise, discrepancy, body.shiftId);

    return reply.send({
      success: true,
      expectedCashPaise: shift.expected_cash_paise,
      actualCashPaise: body.actualCashPaise,
      discrepancyPaise: discrepancy,
      hasDiscrepancy: discrepancy !== 0,
    });
  });

  // 8. POS Sale & Split Tender Checkout
  app.post('/v1/retail/pos/sale', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      locationId: string;
      staffId: string;
      staffName: string;
      customerName?: string;
      customerPhone?: string;
      items: any[];
      payments: Array<{ type: string; amountPaise: number }>;
      discountPaise?: number;
    };

    const storeId = body.storeId || 'store_aura';
    const orderId = `pos_${crypto.randomUUID().slice(0, 8)}`;
    const subtotal = body.items.reduce((acc, item) => acc + (item.priceInPaise * item.quantity), 0);
    const discount = body.discountPaise || 0;
    const total = Math.max(0, subtotal - discount);

    const posSaleTx = db.transaction(() => {
      // 1. Create order
      db.prepare(`
        INSERT INTO orders (
          id, store_id, visitor_id, customer_name, customer_email, customer_phone,
          shipping_address, items_json, subtotal_in_paise, discount_in_paise,
          shipping_fee_in_paise, total_in_paise, savings_in_paise, payment_method, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'pos_split', 'paid')
      `).run(
        orderId,
        storeId,
        `pos_staff_${body.staffId}`,
        body.customerName || 'In-Store Walk-in Customer',
        body.customerPhone ? `${body.customerPhone}@phone.local` : 'pos@aura.local',
        body.customerPhone || null,
        `In-Store Purchase (${body.locationId})`,
        JSON.stringify(body.items),
        subtotal,
        discount,
        total,
        discount
      );

      // 2. Deduct inventory at local location
      for (const item of body.items) {
        db.prepare(`
          UPDATE location_inventory
          SET on_hand = MAX(0, on_hand - ?)
          WHERE location_id = ? AND product_id = ?
        `).run(item.quantity, body.locationId, item.productId);
      }

      // 3. Update active cash drawer if cash tender used
      const cashTender = body.payments.find((p) => p.type === 'cash');
      if (cashTender && cashTender.amountPaise > 0) {
        const activeShift = db
          .prepare("SELECT id FROM store_shifts WHERE location_id = ? AND status = 'open'")
          .get(body.locationId) as any;

        if (activeShift) {
          db.prepare(`
            UPDATE store_shifts
            SET expected_cash_paise = expected_cash_paise + ?
            WHERE id = ?
          `).run(cashTender.amountPaise, activeShift.id);

          db.prepare(`
            INSERT INTO cash_drawer_logs (id, shift_id, type, amount_paise, reason)
            VALUES (?, ?, 'sale', ?, ?)
          `).run(`log_${Date.now()}`, activeShift.id, cashTender.amountPaise, `POS Sale ${orderId}`);
        }
      }
    });

    try {
      posSaleTx();
      return reply.send({
        success: true,
        orderId,
        receipt: {
          receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
          orderId,
          timestamp: new Date().toISOString(),
          locationId: body.locationId,
          staffName: body.staffName,
          items: body.items,
          subtotal,
          discount,
          total,
          payments: body.payments,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 9. BOPIS Orders
  app.get('/v1/retail/bopis', async (request, reply) => {
    const query = request.query as { locationId?: string; storeId?: string };
    const storeId = query.storeId || 'store_aura';

    let sql = 'SELECT * FROM bopis_orders WHERE store_id = ?';
    const params: any[] = [storeId];

    if (query.locationId) {
      sql += ' AND pickup_location_id = ?';
      params.push(query.locationId);
    }
    sql += ' ORDER BY created_at DESC';

    const bopisRows = db.prepare(sql).all(...params) as any[];

    // Join with order items
    const orders = bopisRows.map((b) => {
      const order = db.prepare('SELECT items_json, total_in_paise FROM orders WHERE id = ?').get(b.order_id) as any;
      return {
        ...b,
        items: order ? JSON.parse(order.items_json) : [],
        totalInPaise: order ? order.total_in_paise : 0,
      };
    });

    return reply.send({ bopisOrders: orders });
  });

  // 10. Update BOPIS Status
  app.put('/v1/retail/bopis/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      status: 'picking' | 'ready' | 'collected';
      otpProvided?: string;
    };

    const bopis = db.prepare('SELECT * FROM bopis_orders WHERE order_id = ?').get(id) as any;
    if (!bopis) {
      return reply.status(404).send({ error: 'BOPIS order not found' });
    }

    if (body.status === 'collected') {
      if (body.otpProvided !== bopis.pickup_otp) {
        return reply.status(400).send({ error: 'Invalid Pickup OTP code' });
      }
      db.prepare(`
        UPDATE bopis_orders
        SET pickup_status = 'collected', collected_at = datetime('now')
        WHERE order_id = ?
      `).run(id);
    } else if (body.status === 'ready') {
      db.prepare(`
        UPDATE bopis_orders
        SET pickup_status = 'ready', ready_at = datetime('now')
        WHERE order_id = ?
      `).run(id);
    } else {
      db.prepare(`
        UPDATE bopis_orders
        SET pickup_status = ?
        WHERE order_id = ?
      `).run(body.status, id);
    }

    return reply.send({ success: true, newStatus: body.status });
  });

  // 11. Omnichannel In-Store Returns (BORIS)
  app.post('/v1/retail/returns', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      orderId: string;
      locationId: string;
      returnedItems: Array<{ productId: string; title: string; quantity: number; priceInPaise: number }>;
      reason: string;
      actionType?: 'refund' | 'exchange' | 'store_credit';
    };

    const storeId = body.storeId || 'store_aura';
    const returnId = `ret_${Date.now()}`;
    const refundTotal = body.returnedItems.reduce((sum, item) => sum + (item.priceInPaise * item.quantity), 0);

    const returnTx = db.transaction(() => {
      // 1. Record return log
      db.prepare(`
        INSERT INTO returns_exchanges (
          id, store_id, order_id, location_id, customer_name, returned_items_json,
          refund_amount_paise, action_type, reason, status
        ) VALUES (?, ?, ?, ?, 'Customer', ?, ?, ?, ?, 'completed')
      `).run(
        returnId,
        storeId,
        body.orderId,
        body.locationId,
        JSON.stringify(body.returnedItems),
        refundTotal,
        body.actionType || 'refund',
        body.reason
      );

      // 2. Restock into local store location inventory
      for (const item of body.returnedItems) {
        db.prepare(`
          UPDATE location_inventory
          SET on_hand = on_hand + ?
          WHERE location_id = ? AND product_id = ?
        `).run(item.quantity, body.locationId, item.productId);
      }
    });

    try {
      returnTx();
      return reply.send({ success: true, returnId, refundAmountPaise: refundTotal });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 12. Customer 360 & Store Manager AI Assistant
  app.get('/v1/retail/customers/:id/360', async (request, reply) => {
    const { id } = request.params as { id: string };

    const customer = db.prepare('SELECT * FROM customers WHERE id = ? OR email = ?').get(id, id) as any;
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }

    // Customer past orders
    const pastOrdersRows = db
      .prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC LIMIT 5')
      .all(customer.email) as any[];

    const pastOrders = pastOrdersRows.map((o) => ({
      ...o,
      items: JSON.parse(o.items_json),
    }));

    // AI Recommender for Floor Associate: Look at past orders and suggest complementary drops
    const allProducts = db.prepare('SELECT id, title, price_in_paise, image_url, category FROM products').all() as any[];
    const purchasedIds = new Set(pastOrders.flatMap((o) => o.items.map((i: any) => i.productId)));

    const aiRecommendations = allProducts
      .filter((p) => !purchasedIds.has(p.id))
      .slice(0, 3)
      .map((p) => ({
        productId: p.id,
        title: p.title,
        priceInPaise: p.price_in_paise,
        imageUrl: p.image_url,
        pitchReason:
          p.category === 'Footwear'
            ? `Pairs well with recent ${customer.preferredSize || 'L'} streetwear orders`
            : `High-affinity add-on for ${customer.loyaltyTier} tier VIP`,
      }));

    return reply.send({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        preferredSize: customer.preferred_size,
        totalSpendPaise: customer.total_spend_paise,
        totalOrders: customer.total_orders,
        returnCount: customer.return_count,
        loyaltyTier: customer.loyalty_tier,
        notes: customer.notes,
        pastOrders,
        aiRecommendations,
      },
    });
  });

  // 13. Search Customers
  app.get('/v1/retail/customers', async (request, reply) => {
    const query = request.query as { q?: string; storeId?: string };
    const storeId = query.storeId || 'store_aura';
    const q = (query.q || '').trim();

    const rows = db
      .prepare(`
        SELECT * FROM customers
        WHERE store_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
        LIMIT 10
      `)
      .all(storeId, `%${q}%`, `%${q}%`, `%${q}%`);

    return reply.send({ customers: rows });
  });
}
