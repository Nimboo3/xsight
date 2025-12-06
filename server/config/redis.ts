import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../lib/logger';

// Determine if TLS is needed (Upstash and most cloud Redis require TLS)
const redisUrl = env.REDIS_URL;
const useTls = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io');

// Create Redis connection
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  tls: useTls ? {} : undefined, // Enable TLS for cloud Redis providers
  retryStrategy: (times: number) => {
    if (times > 10) {
      logger.error('Redis connection failed after 10 retries');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    logger.warn({ attempt: times, delay }, 'Retrying Redis connection');
    return delay;
  },
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    if (targetErrors.some(e => err.message.includes(e))) {
      return true;
    }
    return false;
  },
});

// Connection events
redis.on('connect', () => {
  logger.info('Redis connecting...');
});

redis.on('ready', () => {
  logger.info('Redis connected and ready');
});

redis.on('error', (error) => {
  logger.error({ error: error.message }, 'Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Helper to check connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

// Graceful shutdown helper
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

export default redis;
