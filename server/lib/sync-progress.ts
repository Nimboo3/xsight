/**
 * Sync Progress Module - Redis-based real-time sync tracking
 * 
 * This module provides helpers for:
 * - Creating and updating sync runs in Redis
 * - Publishing progress updates via Redis Pub/Sub
 * - Fetching current sync status for REST fallback
 * 
 * Redis Key Structure:
 * - sync:{syncRunId} - Hash containing sync run state
 * - Pub/Sub channel: sync-progress
 */

import { redis } from '../config/redis';
import { logger } from './logger';

const log = logger.child({ module: 'sync-progress' });

// Sync run status types
export type SyncRunStatus = 'pending' | 'running' | 'completed' | 'failed';

// Sync progress data stored in Redis
export interface SyncProgress {
  syncRunId: string;
  tenantId: string;
  resourceType: 'customers' | 'orders' | 'all';
  status: SyncRunStatus;
  progress: number; // 0-100
  step: string;
  recordsProcessed: number;
  totalRecords: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}

// Progress update payload for Pub/Sub
export interface SyncProgressEvent {
  type: 'sync:progress' | 'sync:completed' | 'sync:failed';
  data: SyncProgress;
}

// Redis key helpers
const SYNC_KEY_PREFIX = 'sync:';
const SYNC_PROGRESS_CHANNEL = 'sync-progress';
const SYNC_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Generate a unique sync run ID
 */
export function generateSyncRunId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get Redis key for a sync run
 */
function getSyncKey(syncRunId: string): string {
  return `${SYNC_KEY_PREFIX}${syncRunId}`;
}

/**
 * Create a new sync run in Redis
 */
export async function createSyncRun(
  syncRunId: string,
  tenantId: string,
  resourceType: 'customers' | 'orders' | 'all'
): Promise<SyncProgress> {
  const now = new Date().toISOString();
  
  const progress: SyncProgress = {
    syncRunId,
    tenantId,
    resourceType,
    status: 'pending',
    progress: 0,
    step: 'Initializing...',
    recordsProcessed: 0,
    totalRecords: 0,
    startedAt: now,
    finishedAt: null,
    error: null,
  };

  const key = getSyncKey(syncRunId);
  
  // Store as hash for atomic updates
  await redis.hset(key, {
    syncRunId,
    tenantId,
    resourceType,
    status: progress.status,
    progress: progress.progress.toString(),
    step: progress.step,
    recordsProcessed: progress.recordsProcessed.toString(),
    totalRecords: progress.totalRecords.toString(),
    startedAt: progress.startedAt,
    finishedAt: '',
    error: '',
  });
  
  // Set TTL to auto-cleanup old sync runs
  await redis.expire(key, SYNC_TTL_SECONDS);
  
  log.info({ syncRunId, tenantId, resourceType }, 'Created sync run');
  
  return progress;
}

/**
 * Update sync progress and publish to Pub/Sub
 * Includes built-in throttling to prevent Redis spam
 */
let lastPublishTime: Record<string, number> = {};
const PUBLISH_THROTTLE_MS = 500; // Throttle updates to max 2/second per syncRunId

export async function updateSyncProgress(
  syncRunId: string,
  updates: Partial<Pick<SyncProgress, 'status' | 'progress' | 'step' | 'recordsProcessed' | 'totalRecords' | 'error'>>
): Promise<void> {
  const key = getSyncKey(syncRunId);
  
  // Build update object
  const redisUpdates: Record<string, string> = {};
  if (updates.status !== undefined) redisUpdates.status = updates.status;
  if (updates.progress !== undefined) redisUpdates.progress = updates.progress.toString();
  if (updates.step !== undefined) redisUpdates.step = updates.step;
  if (updates.recordsProcessed !== undefined) redisUpdates.recordsProcessed = updates.recordsProcessed.toString();
  if (updates.totalRecords !== undefined) redisUpdates.totalRecords = updates.totalRecords.toString();
  if (updates.error !== undefined) redisUpdates.error = updates.error || '';
  
  // Update Redis hash
  if (Object.keys(redisUpdates).length > 0) {
    await redis.hset(key, redisUpdates);
  }
  
  // Throttle Pub/Sub publishing
  const now = Date.now();
  const lastPublish = lastPublishTime[syncRunId] || 0;
  const shouldPublish = now - lastPublish >= PUBLISH_THROTTLE_MS;
  
  // Always publish for status changes (completed, failed)
  const isStatusChange = updates.status === 'completed' || updates.status === 'failed';
  
  if (shouldPublish || isStatusChange) {
    lastPublishTime[syncRunId] = now;
    
    // Fetch full progress for publishing
    const progress = await getSyncProgress(syncRunId);
    if (progress) {
      await publishProgress(progress);
    }
  }
}

/**
 * Mark sync run as completed
 */
export async function completeSyncRun(syncRunId: string): Promise<void> {
  const key = getSyncKey(syncRunId);
  const now = new Date().toISOString();
  
  await redis.hset(key, {
    status: 'completed',
    progress: '100',
    step: 'Completed',
    finishedAt: now,
  });
  
  const progress = await getSyncProgress(syncRunId);
  if (progress) {
    await publishProgress(progress, 'sync:completed');
  }
  
  // Cleanup throttle tracking
  delete lastPublishTime[syncRunId];
  
  log.info({ syncRunId }, 'Sync run completed');
}

/**
 * Mark sync run as failed
 */
export async function failSyncRun(syncRunId: string, error: string): Promise<void> {
  const key = getSyncKey(syncRunId);
  const now = new Date().toISOString();
  
  await redis.hset(key, {
    status: 'failed',
    step: 'Failed',
    finishedAt: now,
    error,
  });
  
  const progress = await getSyncProgress(syncRunId);
  if (progress) {
    await publishProgress(progress, 'sync:failed');
  }
  
  // Cleanup throttle tracking
  delete lastPublishTime[syncRunId];
  
  log.error({ syncRunId, error }, 'Sync run failed');
}

/**
 * Get current sync progress from Redis
 */
export async function getSyncProgress(syncRunId: string): Promise<SyncProgress | null> {
  const key = getSyncKey(syncRunId);
  const data = await redis.hgetall(key);
  
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  
  return {
    syncRunId: data.syncRunId,
    tenantId: data.tenantId,
    resourceType: data.resourceType as 'customers' | 'orders' | 'all',
    status: data.status as SyncRunStatus,
    progress: parseInt(data.progress, 10) || 0,
    step: data.step,
    recordsProcessed: parseInt(data.recordsProcessed, 10) || 0,
    totalRecords: parseInt(data.totalRecords, 10) || 0,
    startedAt: data.startedAt,
    finishedAt: data.finishedAt || null,
    error: data.error || null,
  };
}

/**
 * Get all active sync runs for a tenant
 */
export async function getActiveSyncRunsForTenant(tenantId: string): Promise<SyncProgress[]> {
  // Scan for all sync keys
  const keys: string[] = [];
  let cursor = '0';
  
  do {
    const [nextCursor, matchedKeys] = await redis.scan(
      cursor,
      'MATCH',
      `${SYNC_KEY_PREFIX}*`,
      'COUNT',
      100
    );
    cursor = nextCursor;
    keys.push(...matchedKeys);
  } while (cursor !== '0');
  
  // Filter by tenant and active status
  const activeRuns: SyncProgress[] = [];
  
  for (const key of keys) {
    const data = await redis.hgetall(key);
    if (
      data.tenantId === tenantId &&
      (data.status === 'pending' || data.status === 'running')
    ) {
      activeRuns.push({
        syncRunId: data.syncRunId,
        tenantId: data.tenantId,
        resourceType: data.resourceType as 'customers' | 'orders' | 'all',
        status: data.status as SyncRunStatus,
        progress: parseInt(data.progress, 10) || 0,
        step: data.step,
        recordsProcessed: parseInt(data.recordsProcessed, 10) || 0,
        totalRecords: parseInt(data.totalRecords, 10) || 0,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt || null,
        error: data.error || null,
      });
    }
  }
  
  return activeRuns;
}

/**
 * Publish progress event to Redis Pub/Sub
 */
async function publishProgress(
  progress: SyncProgress,
  type: SyncProgressEvent['type'] = 'sync:progress'
): Promise<void> {
  const event: SyncProgressEvent = {
    type,
    data: progress,
  };
  
  try {
    await redis.publish(SYNC_PROGRESS_CHANNEL, JSON.stringify(event));
  } catch (error) {
    log.error({ error, syncRunId: progress.syncRunId }, 'Failed to publish progress');
  }
}

/**
 * Subscribe to sync progress events
 * Returns cleanup function to unsubscribe
 */
export function subscribeToSyncProgress(
  handler: (event: SyncProgressEvent) => void
): () => Promise<void> {
  // Create a separate Redis connection for subscription
  // (Subscribed connections can't be used for other commands)
  const subscriber = redis.duplicate();
  
  subscriber.subscribe(SYNC_PROGRESS_CHANNEL, (err) => {
    if (err) {
      log.error({ error: err }, 'Failed to subscribe to sync progress channel');
    } else {
      log.info('Subscribed to sync progress channel');
    }
  });
  
  subscriber.on('message', (channel, message) => {
    if (channel === SYNC_PROGRESS_CHANNEL) {
      try {
        const event = JSON.parse(message) as SyncProgressEvent;
        handler(event);
      } catch (error) {
        log.error({ error, message }, 'Failed to parse sync progress event');
      }
    }
  });
  
  // Return cleanup function
  return async () => {
    await subscriber.unsubscribe(SYNC_PROGRESS_CHANNEL);
    await subscriber.quit();
    log.info('Unsubscribed from sync progress channel');
  };
}

export { SYNC_PROGRESS_CHANNEL };
