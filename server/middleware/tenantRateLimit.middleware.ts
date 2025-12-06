/**
 * Tenant Rate Limiting Middleware
 * 
 * Uses Redis sliding window algorithm to enforce per-tenant API limits.
 * Limits are based on tenant's planTier and apiCallLimit.
 * 
 * Plan tiers:
 * - FREE: 10,000 requests/month
 * - STARTER: 50,000 requests/month
 * - GROWTH: 200,000 requests/month
 * - ENTERPRISE: 1,000,000 requests/month
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { RateLimitError } from '../lib/errors';
import { config } from '../config/env';

const log = logger.child({ module: 'tenant-rate-limit' });

// Redis key prefix for tenant rate limiting
const RATE_LIMIT_PREFIX = 'ratelimit:tenant:';

// Plan limits (monthly requests)
export const PLAN_LIMITS: Record<string, number> = {
  FREE: 10000,
  STARTER: 50000,
  GROWTH: 200000,
  ENTERPRISE: 1000000,
};

// Rate limit window in seconds (1 minute for sliding window)
const WINDOW_SIZE_SECONDS = 60;

// How many windows to look back (for smoother limits)
const WINDOW_COUNT = 60; // 1 hour of windows

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  monthlyUsed: number;
  monthlyLimit: number;
}

/**
 * Check and increment rate limit for a tenant
 */
async function checkTenantRateLimit(tenantId: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = Math.floor(now / (WINDOW_SIZE_SECONDS * 1000));
  const redisKey = `${RATE_LIMIT_PREFIX}${tenantId}`;
  const monthlyKey = `${RATE_LIMIT_PREFIX}monthly:${tenantId}`;

  // Get tenant's plan tier and limits
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { 
      planTier: true, 
      apiCallLimit: true, 
      monthlyApiCalls: true,
      status: true,
    },
  });

  if (!tenant || tenant.status !== 'ACTIVE') {
    throw new RateLimitError('Tenant not found or inactive');
  }

  // Monthly limit based on plan or custom limit
  const monthlyLimit = tenant.apiCallLimit || PLAN_LIMITS[tenant.planTier] || PLAN_LIMITS.FREE;

  // Per-minute limit (spread monthly limit across month)
  // Assuming 30 days, ~43200 minutes
  // Allow burst of up to 10x average rate
  const perMinuteLimit = Math.max(10, Math.ceil((monthlyLimit / 43200) * 10));

  // Use Redis pipeline for atomic operations
  const pipeline = redis.pipeline();
  
  // Get current window count
  pipeline.hincrby(redisKey, windowKey.toString(), 1);
  pipeline.expire(redisKey, WINDOW_SIZE_SECONDS * WINDOW_COUNT);
  
  // Get all windows for this tenant
  pipeline.hgetall(redisKey);
  
  // Get and increment monthly counter
  pipeline.incr(monthlyKey);
  
  // Set monthly counter expiry (end of month + buffer)
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 1);
  endOfMonth.setHours(0, 0, 0, 0);
  const ttl = Math.ceil((endOfMonth.getTime() - now) / 1000) + 86400; // +1 day buffer
  pipeline.expire(monthlyKey, ttl);

  const results = await pipeline.exec();
  
  // Parse results
  const windowData = (results?.[2]?.[1] as Record<string, string>) || {};
  const monthlyUsed = parseInt((results?.[3]?.[1] as string) || '0', 10);

  // Calculate requests in sliding window
  const oldestValidWindow = windowKey - WINDOW_COUNT;
  let windowTotal = 0;
  
  for (const [key, count] of Object.entries(windowData)) {
    const keyNum = parseInt(key, 10);
    if (keyNum >= oldestValidWindow) {
      windowTotal += parseInt(count, 10);
    }
  }

  // Check if allowed
  const withinMinuteLimit = windowTotal <= perMinuteLimit;
  const withinMonthlyLimit = monthlyUsed <= monthlyLimit;
  const allowed = withinMinuteLimit && withinMonthlyLimit;

  // Calculate reset time
  const resetAt = new Date((windowKey + 1) * WINDOW_SIZE_SECONDS * 1000);

  const result: RateLimitResult = {
    allowed,
    remaining: Math.max(0, perMinuteLimit - windowTotal),
    limit: perMinuteLimit,
    resetAt,
    monthlyUsed,
    monthlyLimit,
  };

  // Update tenant's monthly API calls in DB (async, don't await)
  if (allowed && monthlyUsed % 100 === 0) {
    // Only sync to DB every 100 requests to reduce DB writes
    prisma.tenant.update({
      where: { id: tenantId },
      data: { monthlyApiCalls: monthlyUsed },
    }).catch((error) => {
      log.error({ error, tenantId }, 'Failed to sync monthly API calls to DB');
    });
  }

  return result;
}

/**
 * Tenant rate limiting middleware
 * 
 * Requires tenant to be set on req.tenant (usually by tenant middleware)
 */
export function tenantRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip in development if configured
  if (config.isDev && !process.env.ENFORCE_RATE_LIMITS) {
    return next();
  }

  const tenantId = req.tenant?.id;
  
  if (!tenantId) {
    // No tenant context, skip tenant rate limiting (default rate limit still applies)
    return next();
  }

  checkTenantRateLimit(tenantId)
    .then((result) => {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000).toString());
      res.setHeader('X-RateLimit-Monthly-Used', result.monthlyUsed.toString());
      res.setHeader('X-RateLimit-Monthly-Limit', result.monthlyLimit.toString());

      if (!result.allowed) {
        // Determine which limit was exceeded
        const isMonthlyLimitExceeded = result.monthlyUsed > result.monthlyLimit;
        
        const errorMessage = isMonthlyLimitExceeded
          ? `Monthly API limit exceeded. Used: ${result.monthlyUsed}/${result.monthlyLimit}. Upgrade your plan for higher limits.`
          : `Rate limit exceeded. Try again after ${result.resetAt.toISOString()}`;

        log.warn({
          tenantId,
          remaining: result.remaining,
          monthlyUsed: result.monthlyUsed,
          monthlyLimit: result.monthlyLimit,
          isMonthlyLimitExceeded,
        }, 'Tenant rate limit exceeded');

        res.status(429).json({
          success: false,
          error: {
            code: isMonthlyLimitExceeded ? 'MONTHLY_LIMIT_EXCEEDED' : 'RATE_LIMIT_EXCEEDED',
            message: errorMessage,
            retryAfter: isMonthlyLimitExceeded ? undefined : result.resetAt.toISOString(),
          },
        });
        return;
      }

      next();
    })
    .catch((error) => {
      log.error({ error, tenantId }, 'Rate limit check failed');
      // On error, allow the request to proceed (fail open)
      next();
    });
}

/**
 * Get current rate limit status for a tenant
 */
export async function getTenantRateLimitStatus(tenantId: string): Promise<{
  minuteUsed: number;
  minuteLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  percentUsed: number;
}> {
  const now = Date.now();
  const windowKey = Math.floor(now / (WINDOW_SIZE_SECONDS * 1000));
  const redisKey = `${RATE_LIMIT_PREFIX}${tenantId}`;
  const monthlyKey = `${RATE_LIMIT_PREFIX}monthly:${tenantId}`;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planTier: true, apiCallLimit: true },
  });

  const monthlyLimit = tenant?.apiCallLimit || PLAN_LIMITS[tenant?.planTier || 'FREE'];
  const perMinuteLimit = Math.max(10, Math.ceil((monthlyLimit / 43200) * 10));

  const [windowData, monthlyCount] = await Promise.all([
    redis.hgetall(redisKey),
    redis.get(monthlyKey),
  ]);

  const oldestValidWindow = windowKey - WINDOW_COUNT;
  let minuteUsed = 0;
  
  for (const [key, count] of Object.entries(windowData)) {
    const keyNum = parseInt(key, 10);
    if (keyNum >= oldestValidWindow) {
      minuteUsed += parseInt(count, 10);
    }
  }

  const monthlyUsed = parseInt(monthlyCount || '0', 10);

  return {
    minuteUsed,
    minuteLimit: perMinuteLimit,
    monthlyUsed,
    monthlyLimit,
    percentUsed: Math.round((monthlyUsed / monthlyLimit) * 100),
  };
}

/**
 * Reset rate limit for a tenant (admin use only)
 */
export async function resetTenantRateLimit(tenantId: string): Promise<void> {
  const redisKey = `${RATE_LIMIT_PREFIX}${tenantId}`;
  const monthlyKey = `${RATE_LIMIT_PREFIX}monthly:${tenantId}`;

  await redis.del(redisKey, monthlyKey);
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { monthlyApiCalls: 0 },
  });

  log.info({ tenantId }, 'Tenant rate limit reset');
}
