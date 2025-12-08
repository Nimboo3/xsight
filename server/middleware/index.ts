export { requestIdMiddleware } from './requestId.middleware';
export { 
  verifyShopifyRequest 
} from './tenant.middleware';
export {
  authMiddleware,
  tenantMiddleware,
  authWithTenantMiddleware,
  optionalAuthMiddleware,
  type UserInfo,
  type TenantInfo,
} from './auth.middleware';
export { 
  errorMiddleware, 
  notFoundMiddleware 
} from './error.middleware';
export { 
  defaultRateLimiter, 
  authRateLimiter, 
  webhookRateLimiter, 
  bulkRateLimiter 
} from './rateLimit.middleware';

// Alias for hybrid auth (supports both JWT and session-based auth)
export { authMiddleware as hybridAuthMiddleware } from './auth.middleware';
