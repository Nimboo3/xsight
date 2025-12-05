/**
 * Worker Entry Point
 * Run with: npm run dev:worker
 */

import { logger } from '../lib/logger';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { allWorkers, closeAllWorkers } from './worker';

const log = logger.child({ module: 'worker-main' });

async function main(): Promise<void> {
  log.info('Starting workers...');
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    log.info('Database connected');
  } catch (error) {
    log.fatal({ error }, 'Failed to connect to database');
    process.exit(1);
  }

  // Test Redis connection
  if (redis.status !== 'ready') {
    log.warn('Redis not ready, waiting...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  log.info({ status: redis.status }, 'Redis connection status');

  log.info(
    { workers: allWorkers.map((w) => w.name) },
    'Workers started successfully'
  );
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  log.info({ signal }, 'Received shutdown signal');
  
  await closeAllWorkers();
  await prisma.$disconnect();
  redis.disconnect();
  
  log.info('Worker shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  log.fatal({ error }, 'Uncaught exception in worker');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled rejection in worker');
});

main().catch((error) => {
  log.fatal({ error }, 'Worker startup failed');
  process.exit(1);
});
