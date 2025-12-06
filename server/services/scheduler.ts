/**
 * Scheduler Service - BullMQ Repeatable Jobs
 * 
 * Manages scheduled background tasks:
 * - Daily RFM calculation (midnight UTC)
 * - Segment refresh (after RFM)
 * - Monthly API counter reset (1st of month)
 */

import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { rfmQueue, segmentQueue, QUEUE_NAMES } from './queue';

const log = logger.child({ module: 'scheduler' });

// Scheduler queue for repeatable jobs
export const schedulerQueue = new Queue('scheduler', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 60 * 60, // 7 days
    },
  },
});

// Job type definitions
export interface ScheduledJobData {
  type: 'daily-rfm' | 'segment-refresh' | 'monthly-reset';
  tenantId?: string; // If undefined, run for all tenants
  triggeredAt: string;
}

// Schedule definitions
export const SCHEDULES = {
  // Daily at midnight UTC
  DAILY_RFM: {
    name: 'daily-rfm-calculation',
    pattern: '0 0 * * *', // Cron: midnight UTC
    tz: 'UTC',
  },
  // Daily at 1 AM UTC (after RFM completes)
  SEGMENT_REFRESH: {
    name: 'daily-segment-refresh',
    pattern: '0 1 * * *', // Cron: 1 AM UTC
    tz: 'UTC',
  },
  // Monthly on the 1st at midnight UTC
  MONTHLY_RESET: {
    name: 'monthly-api-reset',
    pattern: '0 0 1 * *', // Cron: 1st of month at midnight
    tz: 'UTC',
  },
} as const;

/**
 * Initialize all scheduled jobs
 */
export async function initializeScheduler(): Promise<void> {
  log.info('Initializing scheduler...');

  try {
    // Remove existing repeatable jobs to avoid duplicates
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await schedulerQueue.removeRepeatableByKey(job.key);
      log.debug({ jobName: job.name }, 'Removed existing repeatable job');
    }

    // Add daily RFM calculation
    await schedulerQueue.add(
      SCHEDULES.DAILY_RFM.name,
      {
        type: 'daily-rfm',
        triggeredAt: new Date().toISOString(),
      },
      {
        repeat: {
          pattern: SCHEDULES.DAILY_RFM.pattern,
          tz: SCHEDULES.DAILY_RFM.tz,
        },
        jobId: SCHEDULES.DAILY_RFM.name,
      }
    );
    log.info({ schedule: SCHEDULES.DAILY_RFM.pattern }, 'Scheduled daily RFM calculation');

    // Add daily segment refresh
    await schedulerQueue.add(
      SCHEDULES.SEGMENT_REFRESH.name,
      {
        type: 'segment-refresh',
        triggeredAt: new Date().toISOString(),
      },
      {
        repeat: {
          pattern: SCHEDULES.SEGMENT_REFRESH.pattern,
          tz: SCHEDULES.SEGMENT_REFRESH.tz,
        },
        jobId: SCHEDULES.SEGMENT_REFRESH.name,
      }
    );
    log.info({ schedule: SCHEDULES.SEGMENT_REFRESH.pattern }, 'Scheduled daily segment refresh');

    // Add monthly API counter reset
    await schedulerQueue.add(
      SCHEDULES.MONTHLY_RESET.name,
      {
        type: 'monthly-reset',
        triggeredAt: new Date().toISOString(),
      },
      {
        repeat: {
          pattern: SCHEDULES.MONTHLY_RESET.pattern,
          tz: SCHEDULES.MONTHLY_RESET.tz,
        },
        jobId: SCHEDULES.MONTHLY_RESET.name,
      }
    );
    log.info({ schedule: SCHEDULES.MONTHLY_RESET.pattern }, 'Scheduled monthly API reset');

    log.info('Scheduler initialized successfully');
  } catch (error) {
    log.error({ error }, 'Failed to initialize scheduler');
    throw error;
  }
}

/**
 * Process daily RFM calculation for all active tenants
 */
export async function processDailyRfm(): Promise<{ processed: number; failed: number }> {
  log.info('Starting daily RFM calculation for all tenants');
  
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, shopifyDomain: true },
  });

  let processed = 0;
  let failed = 0;

  for (const tenant of tenants) {
    try {
      await rfmQueue.add(
        'scheduled-rfm',
        {
          tenantId: tenant.id,
          triggeredBy: 'scheduled',
        },
        {
          jobId: `rfm-${tenant.id}-${Date.now()}`,
          priority: 5, // Lower priority for scheduled jobs
        }
      );
      processed++;
      log.debug({ tenantId: tenant.id }, 'Queued RFM calculation');
    } catch (error) {
      failed++;
      log.error({ error, tenantId: tenant.id }, 'Failed to queue RFM calculation');
    }
  }

  log.info({ processed, failed, total: tenants.length }, 'Daily RFM jobs queued');
  return { processed, failed };
}

/**
 * Process segment refresh for all active tenants
 */
export async function processSegmentRefresh(): Promise<{ processed: number; failed: number }> {
  log.info('Starting segment refresh for all tenants');

  // Get all active segments
  const segments = await prisma.segment.findMany({
    where: {
      isActive: true,
      tenant: { status: 'ACTIVE' },
    },
    select: { id: true, tenantId: true, name: true },
  });

  let processed = 0;
  let failed = 0;

  for (const segment of segments) {
    try {
      await segmentQueue.add(
        'scheduled-refresh',
        {
          tenantId: segment.tenantId,
          segmentId: segment.id,
          reason: 'scheduled',
        },
        {
          jobId: `segment-${segment.id}-${Date.now()}`,
          priority: 5,
        }
      );
      processed++;
      log.debug({ segmentId: segment.id }, 'Queued segment refresh');
    } catch (error) {
      failed++;
      log.error({ error, segmentId: segment.id }, 'Failed to queue segment refresh');
    }
  }

  log.info({ processed, failed, total: segments.length }, 'Segment refresh jobs queued');
  return { processed, failed };
}

/**
 * Reset monthly API call counters for all tenants
 */
export async function processMonthlyReset(): Promise<{ updated: number }> {
  log.info('Starting monthly API counter reset');

  const result = await prisma.tenant.updateMany({
    where: { status: 'ACTIVE' },
    data: { monthlyApiCalls: 0 },
  });

  log.info({ updated: result.count }, 'Monthly API counters reset');
  return { updated: result.count };
}

/**
 * Get scheduler health status
 */
export async function getSchedulerHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  repeatableJobs: Array<{
    name: string;
    pattern: string;
    next: string | null;
  }>;
  queueStats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}> {
  try {
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    const [waiting, active, completed, failed] = await Promise.all([
      schedulerQueue.getWaitingCount(),
      schedulerQueue.getActiveCount(),
      schedulerQueue.getCompletedCount(),
      schedulerQueue.getFailedCount(),
    ]);

    return {
      status: 'healthy',
      repeatableJobs: repeatableJobs.map((job) => ({
        name: job.name,
        pattern: job.pattern || '',
        next: job.next ? new Date(job.next).toISOString() : null,
      })),
      queueStats: { waiting, active, completed, failed },
    };
  } catch (error) {
    log.error({ error }, 'Failed to get scheduler health');
    return {
      status: 'unhealthy',
      repeatableJobs: [],
      queueStats: { waiting: 0, active: 0, completed: 0, failed: 0 },
    };
  }
}

/**
 * Manually trigger a scheduled job (for testing/admin)
 */
export async function triggerScheduledJob(
  type: ScheduledJobData['type'],
  tenantId?: string
): Promise<string> {
  const jobId = `manual-${type}-${Date.now()}`;
  
  await schedulerQueue.add(
    `manual-${type}`,
    {
      type,
      tenantId,
      triggeredAt: new Date().toISOString(),
    },
    { jobId }
  );

  log.info({ type, tenantId, jobId }, 'Manually triggered scheduled job');
  return jobId;
}

/**
 * Close scheduler queue gracefully
 */
export async function closeScheduler(): Promise<void> {
  log.info('Closing scheduler queue...');
  await schedulerQueue.close();
  log.info('Scheduler queue closed');
}
