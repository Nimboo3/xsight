import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { shopify } from '../lib/shopify';
import { logger } from '../lib/logger';
import { tenantMiddleware } from '../middleware';
import { decrypt } from '../lib/crypto';
import { UnauthorizedError } from '../lib/errors';
import { getQueuesHealth } from '../services/queue';

export const apiRouter: Router = Router();

// Middleware to verify session
async function verifySession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shop = req.query.shop as string || req.headers['x-shopify-shop'] as string;
    
    if (!shop) {
      throw new UnauthorizedError('Missing shop parameter');
    }

    const session = await prisma.session.findFirst({
      where: { shop },
    });

    if (!session) {
      throw new UnauthorizedError('Session not found');
    }

    // Check if session is expired
    if (session.expires && new Date(session.expires) < new Date()) {
      throw new UnauthorizedError('Session expired');
    }

    // Attach session to request
    (req as any).session = session;
    next();
  } catch (error) {
    next(error);
  }
}

// Get shop info
apiRouter.get('/shop', verifySession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    res.json({ shop: session.shop });
  } catch (error) {
    logger.error({ error }, 'Get shop info error');
    res.status(500).json({ error: 'Failed to get shop info' });
  }
});

// Create a product (example GraphQL mutation)
apiRouter.post('/products', verifySession, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    
    // Create a GraphQL client
    const client = new shopify.clients.Graphql({
      session: {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        accessToken: session.accessToken,
      } as any,
    });

    const colors = ['Red', 'Orange', 'Yellow', 'Green'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Create product mutation
    const response = await client.request(`
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }
    `, {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    });

    const product = (response as any).data?.productCreate?.product;
    
    if (!product) {
      return res.status(400).json({ error: 'Failed to create product' });
    }

    // Update variant price
    const variantId = product.variants.edges[0]?.node?.id;
    
    if (variantId) {
      const variantResponse = await client.request(`
        mutation shopifyUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants {
              id
              price
              barcode
              createdAt
            }
          }
        }
      `, {
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price: '100.00' }],
        },
      });

      res.json({
        product,
        variant: (variantResponse as any).data?.productVariantsBulkUpdate?.productVariants,
      });
    } else {
      res.json({ product });
    }
  } catch (error) {
    logger.error({ error }, 'Create product error');
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Health check for API
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get tenant info (protected by tenant middleware)
apiRouter.get('/tenant', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant!.id },
      select: {
        id: true,
        shopifyDomain: true,
        shopName: true,
        email: true,
        planTier: true,
        status: true,
        onboardedAt: true,
        _count: {
          select: {
            customers: true,
            orders: true,
            segments: true,
          },
        },
      },
    });

    res.json({ success: true, data: tenant });
  } catch (error) {
    logger.error({ error }, 'Get tenant error');
    res.status(500).json({ error: 'Failed to get tenant info' });
  }
});

// Get dashboard stats
apiRouter.get('/stats', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;

    const [customerCount, orderCount, segmentCount, recentOrders] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.segment.count({ where: { tenantId } }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          shopifyId: true,
          orderNumber: true,
          totalPrice: true,
          createdAt: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Get RFM distribution
    const rfmDistribution = await prisma.customer.groupBy({
      by: ['rfmSegment'],
      where: { tenantId },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        customers: customerCount,
        orders: orderCount,
        segments: segmentCount,
        recentOrders,
        rfmDistribution: rfmDistribution.map((r) => ({
          segment: r.rfmSegment,
          count: r._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Get stats error');
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Queue status endpoint
apiRouter.get('/queues', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const health = await getQueuesHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    logger.error({ error }, 'Get queues status error');
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});
