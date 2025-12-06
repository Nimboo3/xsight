/**
 * Tenants Routes - v1
 * 
 * Tenant management and settings endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { getTenantRateLimitStatus } from '../middleware/tenantRateLimit.middleware';

const log = logger.child({ module: 'tenants-routes' });

export const tenantsRouter = Router();

/**
 * GET /api/v1/tenants/me
 * Get current tenant info
 */
tenantsRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        shopifyDomain: true,
        shopName: true,
        email: true,
        status: true,
        planTier: true,
        monthlyApiCalls: true,
        apiCallLimit: true,
        onboardedAt: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
      });
    }

    // Get rate limit status from Redis
    const rateLimitStatus = await getTenantRateLimitStatus(tenantId);

    res.json({
      success: true,
      data: {
        ...tenant,
        rateLimit: rateLimitStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/tenants/me/stats
 * Get tenant statistics
 */
tenantsRouter.get('/me/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;

    const [
      customerCount,
      orderCount,
      productCount,
      segmentCount,
      recentOrders,
      revenueSum,
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.segment.count({ where: { tenantId } }),
      prisma.order.count({
        where: {
          tenantId,
          orderDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.order.aggregate({
        where: { tenantId, financialStatus: 'PAID' },
        _sum: { totalPrice: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        customers: customerCount,
        orders: orderCount,
        products: productCount,
        segments: segmentCount,
        ordersLast30Days: recentOrders,
        totalRevenue: revenueSum._sum.totalPrice || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/tenants/me/sync-status
 * Get sync job status
 */
tenantsRouter.get('/me/sync-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;

    const recentJobs = await prisma.syncJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        resourceType: true,
        status: true,
        syncMode: true,
        recordsProcessed: true,
        recordsFailed: true,
        totalRecords: true,
        progressPercent: true,
        error: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        createdAt: true,
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { lastSyncAt: true },
    });

    res.json({
      success: true,
      data: {
        lastSyncAt: tenant?.lastSyncAt,
        recentJobs,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/tenants/me/webhooks
 * Get recent webhook events
 */
tenantsRouter.get('/me/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const webhooks = await prisma.webhookEvent.findMany({
      where: { tenantId },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        topic: true,
        processed: true,
        receivedAt: true,
        processedAt: true,
        processingError: true,
      },
    });

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    next(error);
  }
});
