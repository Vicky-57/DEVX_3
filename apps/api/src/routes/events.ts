import { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export async function eventRoutes(app: FastifyInstance) {
  app.post('/v1/events', async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      events: Array<{
        eventName: string;
        visitorId: string;
        sessionId?: string;
        experimentId?: string;
        variantId?: string;
        metadata?: Record<string, unknown>;
      }>;
    };

    const storeId = body.storeId || 'store_aura';
    const events = body.events || [];

    const insert = db.prepare(`
      INSERT INTO analytics_events (
        store_id, event_name, visitor_id, session_id, experiment_id, variant_id, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((evts) => {
      for (const e of evts) {
        insert.run(
          storeId,
          e.eventName,
          e.visitorId || 'guest',
          e.sessionId || `sess_${e.visitorId || 'guest'}`,
          e.experimentId || null,
          e.variantId || null,
          JSON.stringify(e.metadata || {})
        );
      }
    });

    insertMany(events);

    return reply.send({ success: true, count: events.length });
  });
}
