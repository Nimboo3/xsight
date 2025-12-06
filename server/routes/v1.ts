/**
 * API v1 Router
 * 
 * Centralizes all v1 API routes with proper organization.
 * All routes under /api/v1/
 */

import { Router } from 'express';
import { segmentsRouter } from './segments.routes';
import { analyticsRouter } from './analytics.routes';
import { ordersRouter } from './orders.routes';
import { customersRouter } from './customers.routes';
import { tenantsRouter } from './tenants.routes';
import { tenantMiddleware } from '../middleware';
import { tenantRateLimitMiddleware } from '../middleware/tenantRateLimit.middleware';

export const v1Router = Router();

// Apply tenant middleware and rate limiting to all v1 routes
v1Router.use(tenantMiddleware);
v1Router.use(tenantRateLimitMiddleware);

// Mount sub-routers
v1Router.use('/segments', segmentsRouter);
v1Router.use('/analytics', analyticsRouter);
v1Router.use('/orders', ordersRouter);
v1Router.use('/customers', customersRouter);
v1Router.use('/tenants', tenantsRouter);

// API version info
v1Router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    status: 'active',
    documentation: '/api/docs',
  });
});
