import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';
import { getDatabase } from './db/connection';
import { getCache } from './db/cache';
import { PlaybookService } from './services/playbook-service';
import { createApiRoutes } from './routes/api';
import { errorHandler } from './middleware/error-handler';

// Load environment variables
dotenv.config();

/**
 * Main application setup
 */
async function main() {
  const app = new Hono();

  // Global middleware
  app.use('*', logger());
  app.use('*', cors());

  // Initialize database and cache
  console.log('Connecting to database...');
  const db = getDatabase();
  const dbHealthy = await db.healthCheck();
  if (!dbHealthy) {
    console.error('Database health check failed');
    process.exit(1);
  }
  console.log('✓ Database connected');

  console.log('Connecting to Redis cache...');
  const cache = getCache();
  await cache.connect();
  const cacheHealthy = await cache.healthCheck();
  if (!cacheHealthy) {
    console.warn('⚠ Redis health check failed - cache disabled');
  } else {
    console.log('✓ Redis connected');
  }

  // Initialize services
  const playbookService = new PlaybookService(db, cache);

  // Mount API routes
  const apiRoutes = createApiRoutes(playbookService);
  app.route('/api', apiRoutes);

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      name: 'Context Guardian API',
      version: '0.1.0',
      endpoints: {
        health: '/api/v1/health',
        generatePlaybook: 'POST /api/v1/generate-playbook',
      },
    });
  });

  // Health check endpoint (top-level)
  app.get('/health', async (c) => {
    const dbHealthy = await db.healthCheck();
    const cacheHealthy = await cache.healthCheck();

    return c.json({
      status: dbHealthy ? 'ok' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      cache: cacheHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler
  app.onError(errorHandler);

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  
  console.log(`\n🚀 Context Guardian API starting on port ${port}...`);
  
  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`✓ Server running at http://localhost:${port}`);
  console.log(`✓ Health check: http://localhost:${port}/health`);
  console.log(`✓ API endpoint: http://localhost:${port}/api/v1/generate-playbook`);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  const db = getDatabase();
  const cache = getCache();
  await db.close();
  await cache.close();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
