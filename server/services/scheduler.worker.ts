/**
 * Scheduler Worker - Processes scheduled jobs
 * 
 * Handles:
 * - Daily RFM calculation trigger
 * - Segment refresh trigger
 * - Monthly API counter reset
 */

import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../lib/logger';
import {
  ScheduledJobData,
  processDailyRfm,
  processSegmentRefresh,
  processMonthlyReset,
} from './scheduler';

const log = logger.child({ module: 'scheduler-worker' });

/**
 * Process scheduled jobs
 */
async function processScheduledJob(job: Job<ScheduledJobData>): Promise<void> {
  const { type, tenantId, triggeredAt } = job.data;
  
  log.info({ jobId: job.id, type, tenantId, triggeredAt }, 'Processing scheduled job');

  try {
    switch (type) {
      case 'daily-rfm': {
        const result = await processDailyRfm();
        log.info({ result }, 'Daily RFM processing complete');
        break;
      }
      case 'segment-refresh': {
        const result = await processSegmentRefresh();
        log.info({ result }, 'Segment refresh processing complete');
        break;
      }
      case 'monthly-reset': {
        const result = await processMonthlyReset();
        log.info({ result }, 'Monthly reset processing complete');
        break;
      }
      default:
        log.warn({ type }, 'Unknown scheduled job type');
    }
  } catch (error) {
    log.error({ error, type }, 'Scheduled job failed');
    throw error;
  }
}

// Create and export the worker
export const schedulerWorker = new Worker<ScheduledJobData>(
  'scheduler',
  processScheduledJob,
  {
    connection: redis,
    concurrency: 1, // Only one scheduled job at a time
    limiter: {
      max: 5,
      duration: 60000, // Max 5 jobs per minute
    },
  }
);

schedulerWorker.on('completed', (job) => {
  log.info({ jobId: job.id, name: job.name }, 'Scheduled job completed');
});

schedulerWorker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, name: job?.name, error: err.message }, 'Scheduled job failed');
});

schedulerWorker.on('error', (err) => {
  log.error({ error: err }, 'Scheduler worker error');
});

/**
 * Close scheduler worker gracefully
 */
export async function closeSchedulerWorker(): Promise<void> {
  log.info('Closing scheduler worker...');
  await schedulerWorker.close();
  log.info('Scheduler worker closed');
}
