/**
 * Redis Cache Utility
 * 
 * Provides caching layer for expensive database queries.
 * Uses the same Upstash Redis instance as BullMQ queues.
 */

import { redis } from '../config/redis';
import { logger } from './logger';

const log = logger.child({ module: 'cache' });

// TTL constants (in seconds)
export const TTL = {
  SHORT: 60,           // 1 minute - for real-time-ish data
  MEDIUM: 300,         // 5 minutes - for dashboard stats
  LONG: 3600,          // 1 hour - for RFM distribution
  DAY: 86400,          // 1 day - for cohort analysis
} as const;

/**
 * Cache key types for type safety
 */
export type CacheKeyPrefix = 
  | 'rfm:dist'
  | 'rfm:matrix'
  | 'rfm:summary'
  | 'revenue:summary'
  | 'revenue:trend'
  | 'orders:stats'
  | 'orders:daily'
  | 'customers:top'
  | 'cohorts:monthly'
  | 'cohorts:retention';

/**
 * Build a cache key with tenant isolation
 */
export function buildCacheKey(
  prefix: CacheKeyPrefix, 
  tenantId: string, 
  ...parts: (string | number)[]
): string {
  const key = [prefix, tenantId, ...parts].join(':');
  return key;
}

/**
 * Get cached value or compute and cache
 * 
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param compute - Function to compute the value if not cached
 * @returns The cached or computed value
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache
    const cachedValue = await redis.get(key);
    if (cachedValue) {
      log.debug({ key }, 'Cache hit');
      return JSON.parse(cachedValue) as T;
    }

    // Compute fresh value
    log.debug({ key }, 'Cache miss, computing...');
    const value = await compute();

    // Cache it (don't await - fire and forget)
    redis.setex(key, ttlSeconds, JSON.stringify(value)).catch((err) => {
      log.warn({ key, error: err.message }, 'Failed to cache value');
    });

    return value;
  } catch (error) {
    // On cache error, just compute
    log.warn({ key, error: (error as Error).message }, 'Cache error, computing directly');
    return compute();
  }
}

/**
 * Get a cached value without computing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Failed to get cached value');
    return null;
  }
}

/**
 * Set a cached value
 */
export async function setCache<T>(
  key: string, 
  value: T, 
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    log.debug({ key, ttl: ttlSeconds }, 'Value cached');
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Failed to set cache');
  }
}

/**
 * Delete a specific cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const result = await redis.del(key);
    log.debug({ key, deleted: result > 0 }, 'Cache key deleted');
    return result > 0;
  } catch (error) {
    log.warn({ key, error: (error as Error).message }, 'Failed to delete cache');
    return false;
  }
}

/**
 * Invalidate cache keys matching a pattern
 * 
 * Note: KEYS command can be slow on large datasets.
 * For production at scale, consider using SCAN or a different pattern.
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    
    const deleted = await redis.del(...keys);
    log.info({ pattern, deleted }, 'Cache invalidated');
    return deleted;
  } catch (error) {
    log.warn({ pattern, error: (error as Error).message }, 'Failed to invalidate cache');
    return 0;
  }
}

/**
 * Invalidate all cache for a tenant
 * 
 * Call this after:
 * - Data sync (customer/order webhooks)
 * - RFM recalculation
 * - Segment membership updates
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  const patterns = [
    `rfm:*:${tenantId}*`,
    `revenue:*:${tenantId}*`,
    `orders:*:${tenantId}*`,
    `customers:*:${tenantId}*`,
    `cohorts:*:${tenantId}*`,
  ];

  await Promise.all(patterns.map(pattern => invalidatePattern(pattern)));
  log.info({ tenantId }, 'All tenant cache invalidated');
}

/**
 * Cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  info: string | null;
}> {
  try {
    const info = await redis.info('stats');
    return {
      connected: true,
      info,
    };
  } catch (error) {
    return {
      connected: false,
      info: null,
    };
  }
}
