import { Queue, QueueOptions } from 'bullmq';
import { redis } from '../../config/redis';
import { logger } from '../../lib/logger';

const log = logger.child({ module: 'queues' });

// Default queue options
const defaultQueueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 60 * 60, // Keep for 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs
      age: 7 * 24 * 60 * 60, // Keep for 7 days
    },
  },
};

// Queue names
export const QUEUE_NAMES = {
  WEBHOOK_PROCESSING: 'webhook-processing',
  CUSTOMER_SYNC: 'customer-sync',
  ORDER_SYNC: 'order-sync',
  RFM_CALCULATION: 'rfm-calculation',
  SEGMENT_UPDATE: 'segment-update',
  BULK_OPERATIONS: 'bulk-operations',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job type definitions
export interface WebhookJobData {
  tenantId: string;
  topic: string;
  shopDomain: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export interface CustomerSyncJobData {
  tenantId: string;
  shopDomain: string;
  accessToken: string;
  mode: 'full' | 'incremental';
  cursor?: string;
  syncRunId?: string; // For real-time progress tracking
}

export interface OrderSyncJobData {
  tenantId: string;
  shopDomain: string;
  accessToken: string;
  mode: 'full' | 'incremental';
  cursor?: string;
  since?: string;
  syncRunId?: string; // For real-time progress tracking
}

export interface RfmCalculationJobData {
  tenantId: string;
  customerId?: string; // If provided, calculate for single customer
  triggeredBy: 'order' | 'manual' | 'scheduled' | 'sync';
}

export interface SegmentUpdateJobData {
  tenantId: string;
  segmentId: string;
  reason: 'definition_change' | 'rfm_update' | 'scheduled';
}

export interface BulkOperationJobData {
  tenantId: string;
  operationType: 'customer_export' | 'order_export' | 'segment_export';
  filters?: Record<string, unknown>;
}

// Create queue instances
export const webhookQueue = new Queue<WebhookJobData>(
  QUEUE_NAMES.WEBHOOK_PROCESSING,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      priority: 1, // High priority for webhooks
    },
  }
);

export const customerSyncQueue = new Queue<CustomerSyncJobData>(
  QUEUE_NAMES.CUSTOMER_SYNC,
  defaultQueueOptions
);

export const orderSyncQueue = new Queue<OrderSyncJobData>(
  QUEUE_NAMES.ORDER_SYNC,
  defaultQueueOptions
);

export const rfmQueue = new Queue<RfmCalculationJobData>(
  QUEUE_NAMES.RFM_CALCULATION,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      attempts: 5, // More retries for RFM calculations
    },
  }
);

export const segmentQueue = new Queue<SegmentUpdateJobData>(
  QUEUE_NAMES.SEGMENT_UPDATE,
  defaultQueueOptions
);

export const bulkQueue = new Queue<BulkOperationJobData>(
  QUEUE_NAMES.BULK_OPERATIONS,
  {
    ...defaultQueueOptions,
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      // Note: timeout is set at worker level, not job level in BullMQ
      attempts: 2, // Fewer retries for bulk ops
    },
  }
);

// All queues for health checks
export const allQueues = [
  webhookQueue,
  customerSyncQueue,
  orderSyncQueue,
  rfmQueue,
  segmentQueue,
  bulkQueue,
];

/**
 * Close all queue connections gracefully
 */
export async function closeAllQueues(): Promise<void> {
  log.info('Closing all queues...');
  await Promise.all(allQueues.map((queue) => queue.close()));
  log.info('All queues closed');
}

/**
 * Get queue health status
 */
export async function getQueuesHealth(): Promise<Record<string, unknown>> {
  const health: Record<string, unknown> = {};
  
  for (const queue of allQueues) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      
      health[queue.name] = {
        status: 'healthy',
        waiting,
        active,
        completed,
        failed,
      };
    } catch (error) {
      health[queue.name] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  return health;
}

/**
 * Clean stale/stuck jobs from all queues
 * Call this on startup to clear jobs from previous deployments
 */
export async function cleanStaleJobs(): Promise<void> {
  log.info('Cleaning stale jobs from queues...');
  
  for (const queue of allQueues) {
    try {
      // Get stale jobs (stuck for more than 1 hour)
      const staleThreshold = 60 * 60 * 1000; // 1 hour
      
      // Clean delayed jobs that are too old
      const delayed = await queue.getDelayed();
      let cleanedDelayed = 0;
      for (const job of delayed) {
        const jobAge = Date.now() - (job.timestamp || 0);
        if (jobAge > staleThreshold) {
          await job.remove();
          cleanedDelayed++;
        }
      }
      
      // Clean waiting jobs that are too old
      const waiting = await queue.getWaiting();
      let cleanedWaiting = 0;
      for (const job of waiting) {
        const jobAge = Date.now() - (job.timestamp || 0);
        if (jobAge > staleThreshold) {
          await job.remove();
          cleanedWaiting++;
        }
      }
      
      // Clean failed jobs older than 1 day
      const failed = await queue.getFailed();
      let cleanedFailed = 0;
      for (const job of failed) {
        const jobAge = Date.now() - (job.timestamp || 0);
        if (jobAge > 24 * 60 * 60 * 1000) { // 24 hours
          await job.remove();
          cleanedFailed++;
        }
      }
      
      // Obliterate stuck active jobs (jobs that started but never finished)
      // This is aggressive but necessary for stuck deployments
      const active = await queue.getActive();
      let cleanedActive = 0;
      for (const job of active) {
        const processedAge = Date.now() - (job.processedOn || job.timestamp || 0);
        if (processedAge > staleThreshold) {
          // Move to failed instead of removing completely
          await job.moveToFailed(new Error('Job stuck from previous deployment'), 'stale-cleanup');
          cleanedActive++;
        }
      }
      
      if (cleanedDelayed + cleanedWaiting + cleanedFailed + cleanedActive > 0) {
        log.info({
          queue: queue.name,
          cleanedDelayed,
          cleanedWaiting,
          cleanedFailed,
          cleanedActive,
        }, 'Cleaned stale jobs');
      }
    } catch (error) {
      log.error({ queue: queue.name, error }, 'Failed to clean stale jobs');
    }
  }
  
  log.info('Stale job cleanup complete');
}
