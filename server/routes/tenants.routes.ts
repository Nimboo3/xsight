/**
 * Tenants Routes - v1
 * 
 * Tenant management and settings endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { getTenantRateLimitStatus } from '../middleware/tenantRateLimit.middleware';
import { customerSyncQueue, orderSyncQueue } from '../services/queue/queues';
import { decrypt } from '../lib/crypto';
import { invalidateTenantCache } from '../lib/cache';
import {
  generateSyncRunId,
  createSyncRun,
  getSyncProgress,
  getActiveSyncRunsForTenant,
} from '../lib/sync-progress';

const log = logger.child({ module: 'tenants-routes' });

export const tenantsRouter: Router = Router();

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
        mode: true,
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
 * POST /api/v1/tenants/me/sync
 * Trigger data sync from Shopify
 */
tenantsRouter.post('/me/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;
    const { resource = 'all', mode = 'full' } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        shopifyDomain: true,
        accessToken: true,
      },
    });

    if (!tenant || !tenant.accessToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_ACCESS_TOKEN', message: 'Store not connected' },
      });
    }

    const accessToken = decrypt(tenant.accessToken);
    const jobIds: string[] = [];

    // Generate a unique sync run ID for real-time tracking
    const syncRunId = generateSyncRunId();
    const resourceType = resource as 'customers' | 'orders' | 'all';
    
    // Create sync run in Redis for real-time progress tracking
    await createSyncRun(syncRunId, tenantId, resourceType);

    // Queue customer sync
    if (resource === 'all' || resource === 'customers') {
      const customerJob = await customerSyncQueue.add('sync-customers', {
        tenantId,
        shopDomain: tenant.shopifyDomain,
        accessToken,
        mode: mode as 'full' | 'incremental',
        syncRunId, // Pass syncRunId to worker
      });
      jobIds.push(customerJob.id!);
      log.info({ jobId: customerJob.id, tenantId, syncRunId }, 'Queued customer sync');
    }

    // Queue order sync
    if (resource === 'all' || resource === 'orders') {
      const orderJob = await orderSyncQueue.add('sync-orders', {
        tenantId,
        shopDomain: tenant.shopifyDomain,
        accessToken,
        mode: mode as 'full' | 'incremental',
        syncRunId, // Pass syncRunId to worker
      });
      jobIds.push(orderJob.id!);
      log.info({ jobId: orderJob.id, tenantId, syncRunId }, 'Queued order sync');
    }

    // Immediately invalidate cache so UI refreshes with fresh data
    await invalidateTenantCache(tenantId);
    log.info({ tenantId }, 'Invalidated tenant cache for sync');

    res.json({
      success: true,
      data: {
        message: 'Sync jobs queued successfully',
        syncRunId, // Return syncRunId for frontend to subscribe
        jobIds,
        resource,
        mode,
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

/**
 * GET /api/v1/tenants/me/sync/:syncRunId/status
 * Get real-time sync progress (REST fallback for WebSocket)
 */
tenantsRouter.get('/me/sync/:syncRunId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;
    const { syncRunId } = req.params;

    const progress = await getSyncProgress(syncRunId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: { code: 'SYNC_NOT_FOUND', message: 'Sync run not found' },
      });
    }

    // Verify sync belongs to this tenant
    if (progress.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
      });
    }

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/tenants/me/sync/active
 * Get all active sync runs for current tenant
 */
tenantsRouter.get('/me/sync/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;

    const activeSyncs = await getActiveSyncRunsForTenant(tenantId);

    res.json({
      success: true,
      data: activeSyncs,
    });
  } catch (error) {
    next(error);
  }
});
