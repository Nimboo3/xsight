/**
 * Customers Routes - v1
 * 
 * Customer management and RFM data endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../lib/errors';

const log = logger.child({ module: 'customers-routes' });

export const customersRouter: Router = Router();

// Query params schema
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['totalSpent', 'ordersCount', 'lastOrderDate', 'createdAt', 'rfmSegment']).default('totalSpent'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  rfmSegment: z.string().optional(),
  isHighValue: z.coerce.boolean().optional(),
  isChurnRisk: z.coerce.boolean().optional(),
});

/**
 * GET /api/v1/customers
 * List customers with pagination and filters
 */
customersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;
    const query = listQuerySchema.parse(req.query);
    
    const { page, limit, sortBy, sortOrder, search, rfmSegment, isHighValue, isChurnRisk } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (rfmSegment) {
      where.rfmSegment = rfmSegment;
    }
    
    if (isHighValue !== undefined) {
      where.isHighValue = isHighValue;
    }
    
    if (isChurnRisk !== undefined) {
      where.isChurnRisk = isChurnRisk;
    }

    // Execute query
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          ordersCount: true,
          avgOrderValue: true,
          lastOrderDate: true,
          firstOrderDate: true,
          daysSinceLastOrder: true,
          recencyScore: true,
          frequencyScore: true,
          monetaryScore: true,
          rfmSegment: true,
          isHighValue: true,
          isChurnRisk: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + customers.length < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/customers/:id
 * Get single customer details
 */
customersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        orders: {
          take: 10,
          orderBy: { orderDate: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            orderName: true,
            totalPrice: true,
            financialStatus: true,
            fulfillmentStatus: true,
            orderDate: true,
          },
        },
        segmentMembers: {
          include: {
            segment: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/customers/:id/orders
 * Get customer orders
 */
customersRouter.get('/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: id, tenantId },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        select: {
          id: true,
          shopifyId: true,
          orderNumber: true,
          orderName: true,
          totalPrice: true,
          subtotalPrice: true,
          totalTax: true,
          totalDiscounts: true,
          financialStatus: true,
          fulfillmentStatus: true,
          lineItemsCount: true,
          orderDate: true,
          currency: true,
        },
      }),
      prisma.order.count({ where: { customerId: id, tenantId } }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/customers/stats/overview
 * Get customer statistics overview
 */
customersRouter.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant!.id;

    const [
      totalCustomers,
      highValueCount,
      churnRiskCount,
      rfmDistribution,
      aggregates,
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, isHighValue: true } }),
      prisma.customer.count({ where: { tenantId, isChurnRisk: true } }),
      prisma.customer.groupBy({
        by: ['rfmSegment'],
        where: { tenantId, rfmSegment: { not: null } },
        _count: true,
      }),
      prisma.customer.aggregate({
        where: { tenantId },
        _avg: {
          totalSpent: true,
          ordersCount: true,
          avgOrderValue: true,
        },
        _sum: {
          totalSpent: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        highValueCount,
        churnRiskCount,
        averageSpend: aggregates._avg.totalSpent || 0,
        averageOrders: aggregates._avg.ordersCount || 0,
        averageOrderValue: aggregates._avg.avgOrderValue || 0,
        totalRevenue: aggregates._sum.totalSpent || 0,
        rfmDistribution: rfmDistribution.map((item) => ({
          segment: item.rfmSegment,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});
