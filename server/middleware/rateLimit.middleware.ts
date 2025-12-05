import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { RateLimitError } from '../lib/errors';

/**
 * Default rate limiter for API endpoints
 * 100 requests per minute per IP
 */
export const defaultRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  handler: (req, _res, _next, options) => {
    throw new RateLimitError(
      `Too many requests. Limit: ${options.max} per ${options.windowMs / 1000}s`
    );
  },
  skip: () => config.isDev, // Skip in development
});

/**
 * Strict rate limiter for auth endpoints
 * 10 requests per minute per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, _next, options) => {
    throw new RateLimitError(
      `Too many authentication attempts. Limit: ${options.max} per ${options.windowMs / 1000}s`
    );
  },
  skip: () => config.isDev,
});

/**
 * Webhook rate limiter
 * Higher limit for Shopify webhooks
 * 500 requests per minute
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use shop domain as key if available
    return (req.headers['x-shopify-shop-domain'] as string) || req.ip || 'unknown';
  },
  handler: (req, _res, _next, options) => {
    throw new RateLimitError(
      `Webhook rate limit exceeded. Limit: ${options.max} per ${options.windowMs / 1000}s`
    );
  },
});

/**
 * Bulk operation rate limiter
 * 20 requests per minute
 */
export const bulkRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, _next, options) => {
    throw new RateLimitError(
      `Bulk operation rate limit exceeded. Limit: ${options.max} per ${options.windowMs / 1000}s`
    );
  },
  skip: () => config.isDev,
});
