import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { initSchema } from './db.js';
import { configRoutes } from './routes/config.js';
import { catalogRoutes } from './routes/catalog.js';
import { cartRoutes } from './routes/cart.js';
import { upsellRoutes } from './routes/upsell.js';
import { couponRoutes } from './routes/coupons.js';
import { checkoutRoutes } from './routes/checkout.js';
import { eventRoutes } from './routes/events.js';
import { adminRoutes } from './routes/admin.js';
import { searchRoutes } from './routes/search.js';
import { retailOSRoutes } from './routes/retailos.js';

const app = Fastify({
  logger: {
    level: 'info',
  },
});

async function main() {
  // Initialize Database Schema
  initSchema();

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Serve static widget bundle if built
  const possibleWidgetDirs = [
    path.resolve(process.cwd(), '../../packages/widget/dist'),
    path.resolve(process.cwd(), '../packages/widget/dist'),
    path.resolve(process.cwd(), 'packages/widget/dist'),
    path.resolve(process.cwd(), 'dist/widget'),
  ];
  const widgetDist = possibleWidgetDirs.find((p) => fs.existsSync(p)) || possibleWidgetDirs[0];
  if (fs.existsSync(widgetDist)) {
    await app.register(fastifyStatic, {
      root: widgetDist,
      prefix: '/widget/',
    });

    app.get('/cartx.js', async (_request, reply) => {
      const filePath = path.join(widgetDist, 'cartx.js');
      if (fs.existsSync(filePath)) {
        reply.header('Content-Type', 'application/javascript');
        reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return reply.sendFile('cartx.js', widgetDist);
      }
      return reply.status(404).send({ error: 'cartx.js not yet compiled' });
    });
  }

  // Register API Routes
  await app.register(configRoutes);
  await app.register(catalogRoutes);
  await app.register(cartRoutes);
  await app.register(upsellRoutes);
  await app.register(couponRoutes);
  await app.register(checkoutRoutes);
  await app.register(eventRoutes);
  await app.register(adminRoutes);
  await app.register(searchRoutes);
  await app.register(retailOSRoutes);

  // Health check
  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 4000;
  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 CartX Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
