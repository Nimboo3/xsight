import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import {
  QUEUE_NAMES,
  WebhookJobData,
  CustomerSyncJobData,
  OrderSyncJobData,
  RfmCalculationJobData,
  SegmentUpdateJobData,
  BulkOperationJobData,
} from './queue';

const log = logger.child({ module: 'worker' });

// Worker options
const workerOptions = {
  connection: redis,
  concurrency: 5,
};

/**
 * Process webhook events
 */
async function processWebhook(job: Job<WebhookJobData>): Promise<void> {
  const { tenantId, topic, shopDomain, payload, receivedAt } = job.data;
  log.info({ jobId: job.id, topic, shopDomain }, 'Processing webhook');

  try {
    // Route to appropriate handler based on topic
    switch (topic) {
      case 'customers/create':
      case 'customers/update':
        await handleCustomerWebhook(tenantId, topic, payload);
        break;
      case 'customers/delete':
        await handleCustomerDelete(tenantId, payload);
        break;
      case 'orders/create':
      case 'orders/updated':
      case 'orders/paid':
        await handleOrderWebhook(tenantId, topic, payload);
        break;
      case 'orders/cancelled':
        await handleOrderCancellation(tenantId, payload);
        break;
      default:
        log.info({ topic }, 'Unhandled webhook topic');
    }

    // Mark webhook event as processed
    await prisma.webhookEvent.updateMany({
      where: {
        tenantId,
        topic,
        processedAt: null,
      },
      data: {
        processedAt: new Date(),
        status: 'PROCESSED',
      },
    });
  } catch (error) {
    log.error({ error, topic }, 'Webhook processing failed');
    
    // Mark as failed
    await prisma.webhookEvent.updateMany({
      where: {
        tenantId,
        topic,
        processedAt: null,
      },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    throw error; // Re-throw to trigger retry
  }
}

async function handleCustomerWebhook(
  tenantId: string,
  topic: string,
  payload: Record<string, unknown>
): Promise<void> {
  const shopifyId = String(payload.id);
  
  await prisma.customer.upsert({
    where: {
      tenantId_shopifyCustomerId: {
        tenantId,
        shopifyCustomerId: shopifyId,
      },
    },
    update: {
      email: payload.email as string || null,
      firstName: payload.first_name as string || null,
      lastName: payload.last_name as string || null,
      phone: payload.phone as string || null,
      tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags as string)?.split(',') || [],
      shopifyData: payload as any,
      updatedAt: new Date(),
    },
    create: {
      tenantId,
      shopifyCustomerId: shopifyId,
      email: payload.email as string || null,
      firstName: payload.first_name as string || null,
      lastName: payload.last_name as string || null,
      phone: payload.phone as string || null,
      tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags as string)?.split(',') || [],
      shopifyData: payload as any,
    },
  });

  log.info({ tenantId, shopifyId }, 'Customer upserted from webhook');
}

async function handleCustomerDelete(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const shopifyId = String(payload.id);
  
  // Soft delete - mark as deleted but keep for analytics
  await prisma.customer.updateMany({
    where: {
      tenantId,
      shopifyCustomerId: shopifyId,
    },
    data: {
      // Add a deletedAt field if needed for soft deletes
      tags: { push: 'deleted' },
    },
  });

  log.info({ tenantId, shopifyId }, 'Customer marked as deleted');
}

async function handleOrderWebhook(
  tenantId: string,
  topic: string,
  payload: Record<string, unknown>
): Promise<void> {
  const shopifyOrderId = String(payload.id);
  const customerData = payload.customer as Record<string, unknown> | null;
  
  // Find or create customer
  let customerId: string | null = null;
  
  if (customerData?.id) {
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_shopifyCustomerId: {
          tenantId,
          shopifyCustomerId: String(customerData.id),
        },
      },
      update: {},
      create: {
        tenantId,
        shopifyCustomerId: String(customerData.id),
        email: customerData.email as string || null,
        firstName: customerData.first_name as string || null,
        lastName: customerData.last_name as string || null,
      },
    });
    customerId = customer.id;
  }

  await prisma.order.upsert({
    where: {
      tenantId_shopifyOrderId: {
        tenantId,
        shopifyOrderId,
      },
    },
    update: {
      customerId,
      totalPrice: parseFloat(payload.total_price as string) || 0,
      currency: payload.currency as string || 'USD',
      financialStatus: mapFinancialStatus(payload.financial_status as string),
      fulfillmentStatus: mapFulfillmentStatus(payload.fulfillment_status as string),
      shopifyData: payload as any,
      updatedAt: new Date(),
    },
    create: {
      tenantId,
      shopifyOrderId,
      customerId,
      orderNumber: payload.order_number as number || 0,
      totalPrice: parseFloat(payload.total_price as string) || 0,
      currency: payload.currency as string || 'USD',
      financialStatus: mapFinancialStatus(payload.financial_status as string),
      fulfillmentStatus: mapFulfillmentStatus(payload.fulfillment_status as string),
      orderDate: new Date(payload.created_at as string),
      shopifyData: payload as any,
    },
  });

  log.info({ tenantId, shopifyOrderId }, 'Order upserted from webhook');

  // Trigger RFM recalculation for customer
  if (customerId) {
    // Import rfmQueue dynamically to avoid circular dependency
    const { rfmQueue } = await import('./queue');
    await rfmQueue.add(`rfm:${customerId}`, {
      tenantId,
      customerId,
      triggeredBy: 'order',
    });
  }
}

async function handleOrderCancellation(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const shopifyOrderId = String(payload.id);
  
  await prisma.order.updateMany({
    where: {
      tenantId,
      shopifyOrderId,
    },
    data: {
      financialStatus: 'REFUNDED',
      cancelledAt: new Date(payload.cancelled_at as string || Date.now()),
    },
  });

  log.info({ tenantId, shopifyOrderId }, 'Order cancelled');
}

function mapFinancialStatus(status: string | null): any {
  const statusMap: Record<string, string> = {
    pending: 'PENDING',
    authorized: 'AUTHORIZED',
    partially_paid: 'PARTIALLY_PAID',
    paid: 'PAID',
    partially_refunded: 'PARTIALLY_REFUNDED',
    refunded: 'REFUNDED',
    voided: 'VOIDED',
  };
  return statusMap[status || ''] || 'PENDING';
}

function mapFulfillmentStatus(status: string | null): any {
  const statusMap: Record<string, string> = {
    null: 'UNFULFILLED',
    partial: 'PARTIAL',
    fulfilled: 'FULFILLED',
    restocked: 'RESTOCKED',
  };
  return statusMap[status || 'null'] || 'UNFULFILLED';
}

/**
 * Process customer sync jobs
 */
async function processCustomerSync(job: Job<CustomerSyncJobData>): Promise<void> {
  const { tenantId, shopDomain, mode, cursor } = job.data;
  log.info({ jobId: job.id, tenantId, mode }, 'Processing customer sync');
  
  // TODO: Implement Shopify Admin API sync
  // This will be implemented in Day 3
}

/**
 * Process order sync jobs
 */
async function processOrderSync(job: Job<OrderSyncJobData>): Promise<void> {
  const { tenantId, shopDomain, mode, cursor, since } = job.data;
  log.info({ jobId: job.id, tenantId, mode }, 'Processing order sync');
  
  // TODO: Implement Shopify Admin API sync
  // This will be implemented in Day 3
}

/**
 * Process RFM calculation jobs
 */
async function processRfmCalculation(job: Job<RfmCalculationJobData>): Promise<void> {
  const { tenantId, customerId, triggeredBy } = job.data;
  log.info({ jobId: job.id, tenantId, customerId, triggeredBy }, 'Processing RFM calculation');
  
  // TODO: Implement RFM calculation
  // This will be implemented in Day 6
}

/**
 * Process segment update jobs
 */
async function processSegmentUpdate(job: Job<SegmentUpdateJobData>): Promise<void> {
  const { tenantId, segmentId, reason } = job.data;
  log.info({ jobId: job.id, tenantId, segmentId, reason }, 'Processing segment update');
  
  // TODO: Implement segment membership update
  // This will be implemented in Day 7
}

/**
 * Process bulk operation jobs
 */
async function processBulkOperation(job: Job<BulkOperationJobData>): Promise<void> {
  const { tenantId, operationType, filters } = job.data;
  log.info({ jobId: job.id, tenantId, operationType }, 'Processing bulk operation');
  
  // TODO: Implement bulk operations
  // This will be implemented in Day 4
}

// Create workers
export const webhookWorker = new Worker(
  QUEUE_NAMES.WEBHOOK_PROCESSING,
  processWebhook,
  workerOptions
);

export const customerSyncWorker = new Worker(
  QUEUE_NAMES.CUSTOMER_SYNC,
  processCustomerSync,
  workerOptions
);

export const orderSyncWorker = new Worker(
  QUEUE_NAMES.ORDER_SYNC,
  processOrderSync,
  workerOptions
);

export const rfmWorker = new Worker(
  QUEUE_NAMES.RFM_CALCULATION,
  processRfmCalculation,
  { ...workerOptions, concurrency: 10 } // Higher concurrency for RFM
);

export const segmentWorker = new Worker(
  QUEUE_NAMES.SEGMENT_UPDATE,
  processSegmentUpdate,
  workerOptions
);

export const bulkWorker = new Worker(
  QUEUE_NAMES.BULK_OPERATIONS,
  processBulkOperation,
  { ...workerOptions, concurrency: 2 } // Lower concurrency for bulk ops
);

// All workers for management
export const allWorkers = [
  webhookWorker,
  customerSyncWorker,
  orderSyncWorker,
  rfmWorker,
  segmentWorker,
  bulkWorker,
];

// Worker event handlers
for (const worker of allWorkers) {
  worker.on('completed', (job) => {
    log.info({ jobId: job.id, queue: worker.name }, 'Job completed');
  });

  worker.on('failed', (job, error) => {
    log.error({ jobId: job?.id, queue: worker.name, error }, 'Job failed');
  });

  worker.on('error', (error) => {
    log.error({ queue: worker.name, error }, 'Worker error');
  });
}

/**
 * Gracefully close all workers
 */
export async function closeAllWorkers(): Promise<void> {
  log.info('Closing all workers...');
  await Promise.all(allWorkers.map((worker) => worker.close()));
  log.info('All workers closed');
}
