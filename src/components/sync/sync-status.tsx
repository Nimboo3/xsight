'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Play, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSyncStatus, useTriggerSync, type SyncJob } from '@/hooks/use-api';
import { useActiveSyncs, useSyncRunProgress, type SyncProgress } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';

// Status badge variants
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return { variant: 'success' as const, icon: CheckCircle2, label: 'Completed' };
    case 'running':
      return { variant: 'default' as const, icon: Loader2, label: 'Running' };
    case 'pending':
      return { variant: 'secondary' as const, icon: Clock, label: 'Pending' };
    case 'failed':
      return { variant: 'destructive' as const, icon: XCircle, label: 'Failed' };
    case 'cancelled':
      return { variant: 'outline' as const, icon: AlertTriangle, label: 'Cancelled' };
    default:
      return { variant: 'secondary' as const, icon: Clock, label: status };
  }
}

// Resource type labels
const RESOURCE_LABELS: Record<string, string> = {
  CUSTOMERS: 'Customers',
  ORDERS: 'Orders',
  PRODUCTS: 'Products',
  CART_ABANDONMENTS: 'Cart Abandonments',
  CHECKOUTS: 'Checkouts',
};

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Format duration
function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

interface SyncJobRowProps {
  job: SyncJob;
}

function SyncJobRow({ job }: SyncJobRowProps) {
  const statusInfo = getStatusBadge(job.status);
  const StatusIcon = statusInfo.icon;
  const isRunning = job.status === 'RUNNING';

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Badge variant={statusInfo.variant} className="gap-1">
          <StatusIcon className={cn('h-3 w-3', isRunning && 'animate-spin')} />
          {statusInfo.label}
        </Badge>
        <div>
          <p className="text-sm font-medium">
            {RESOURCE_LABELS[job.resourceType] || job.resourceType}
          </p>
          <p className="text-xs text-muted-foreground">
            {job.syncMode === 'FULL' ? 'Full sync' : 'Incremental'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {/* Progress */}
        {job.totalRecords !== null && (
          <Tooltip>
            <TooltipTrigger>
              <span className="tabular-nums">
                {job.recordsProcessed}/{job.totalRecords}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {job.progressPercent}% complete
              {job.recordsFailed > 0 && ` • ${job.recordsFailed} failed`}
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Duration */}
        <span className="tabular-nums w-16 text-right">
          {formatDuration(job.durationMs)}
        </span>
        
        {/* Time */}
        <span className="w-20 text-right">
          {formatRelativeTime(job.completedAt || job.startedAt || job.createdAt)}
        </span>
      </div>
    </div>
  );
}

interface SyncStatusProps {
  className?: string;
  compact?: boolean;
}

export function SyncStatus({ className, compact = false }: SyncStatusProps) {
  const { data, isLoading, error, refetch, isFetching } = useSyncStatus();
  const triggerSync = useTriggerSync();
  const { activeSyncs, isConnected } = useActiveSyncs();
  const [currentSyncRunId, setCurrentSyncRunId] = useState<string | null>(null);
  
  // Subscribe to current sync progress
  const { progress: realtimeProgress } = useSyncRunProgress(currentSyncRunId);
  
  const handleTriggerSync = () => {
    triggerSync.mutate({ resource: 'all', mode: 'full' }, {
      onSuccess: (response) => {
        // Subscribe to the new sync run for real-time updates
        if (response?.data?.syncRunId) {
          setCurrentSyncRunId(response.data.syncRunId);
        }
        // Refetch status after triggering
        setTimeout(() => refetch(), 1000);
      },
    });
  };
  
  // Clear sync run ID when sync completes
  useEffect(() => {
    if (realtimeProgress?.status === 'completed' || realtimeProgress?.status === 'failed') {
      setTimeout(() => {
        setCurrentSyncRunId(null);
        refetch();
      }, 2000);
    }
  }, [realtimeProgress?.status, refetch]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>Failed to load sync status</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const syncData = data?.data;
  const recentJobs = syncData?.recentJobs || [];
  const lastSyncAt = syncData?.lastSyncAt;
  
  // Check if any job is currently running (from API or WebSocket)
  const hasRunningJob = recentJobs.some(job => job.status === 'RUNNING') || 
    activeSyncs.some(sync => sync.status === 'running' || sync.status === 'pending');
  
  // Get active real-time sync progress
  const activeSync = realtimeProgress || activeSyncs[0] || null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Tooltip>
          <TooltipTrigger>
            <div className={cn(
              'h-2 w-2 rounded-full',
              !isConnected ? 'bg-gray-400' : hasRunningJob ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
            )} />
          </TooltipTrigger>
          <TooltipContent>
            {!isConnected ? 'WebSocket disconnected' : hasRunningJob ? 'Sync in progress' : 'Synced'}
          </TooltipContent>
        </Tooltip>
        <span className="text-muted-foreground">
          {hasRunningJob && activeSync 
            ? `${activeSync.step} (${activeSync.progress}%)`
            : hasRunningJob 
              ? 'Syncing...' 
              : `Last sync: ${formatRelativeTime(lastSyncAt ?? null)}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Sync Status
              <div className={cn(
                'h-2 w-2 rounded-full',
                hasRunningJob ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
              )} />
              {/* WebSocket connection indicator */}
              <Tooltip>
                <TooltipTrigger>
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-gray-400" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {isConnected ? 'Real-time updates connected' : 'Real-time updates disconnected'}
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Last sync: {formatRelativeTime(lastSyncAt ?? null)}
            </CardDescription>
          </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleTriggerSync}
            disabled={triggerSync.isPending || hasRunningJob}
          >
            <Play className={cn('h-3 w-3 mr-1', triggerSync.isPending && 'animate-pulse')} />
            {triggerSync.isPending ? 'Starting...' : 'Sync Now'}
          </Button>
        </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Real-time sync progress */}
        {activeSync && (activeSync.status === 'running' || activeSync.status === 'pending') && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {activeSync.resourceType === 'all' ? 'Full Sync' : 
                   activeSync.resourceType === 'customers' ? 'Customer Sync' : 'Order Sync'}
                </span>
              </div>
              <span className="text-sm font-medium text-blue-600">{activeSync.progress}%</span>
            </div>
            <Progress value={activeSync.progress} className="h-2 bg-blue-100" />
            <div className="flex items-center justify-between mt-2 text-xs text-blue-600">
              <span>{activeSync.step}</span>
              {activeSync.totalRecords > 0 && (
                <span>{activeSync.recordsProcessed} / {activeSync.totalRecords} records</span>
              )}
            </div>
          </div>
        )}
        
        {/* Completed/Failed sync notification */}
        {activeSync && activeSync.status === 'completed' && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Sync completed successfully
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {activeSync.recordsProcessed} records processed
            </p>
          </div>
        )}
        
        {activeSync && activeSync.status === 'failed' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Sync failed
              </span>
            </div>
            {activeSync.error && (
              <p className="text-xs text-red-600 mt-1">{activeSync.error}</p>
            )}
          </div>
        )}
        
        {recentJobs.length === 0 && !activeSync ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No sync jobs yet</p>
            <p className="text-xs text-muted-foreground">
              Data will sync automatically via webhooks
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {recentJobs.slice(0, 5).map((job) => (
              <SyncJobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export a mini version for the sidebar/header
export function SyncStatusIndicator({ className }: { className?: string }) {
  const { data, isLoading } = useSyncStatus();
  const { activeSyncs, isConnected } = useActiveSyncs();
  
  if (isLoading) {
    return <Skeleton className={cn('h-4 w-20', className)} />;
  }
  
  const hasRunningJob = data?.data?.recentJobs?.some(job => job.status === 'RUNNING') ||
    activeSyncs.some(sync => sync.status === 'running' || sync.status === 'pending');
  
  const activeSync = activeSyncs[0];
  
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
          <div className={cn(
            'h-1.5 w-1.5 rounded-full',
            hasRunningJob ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
          )} />
          {hasRunningJob && activeSync 
            ? `Syncing ${activeSync.progress}%` 
            : hasRunningJob 
              ? 'Syncing' 
              : 'Synced'}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          {hasRunningJob && activeSync ? (
            <div>
              <p className="font-medium">{activeSync.step}</p>
              <p className="text-muted-foreground">
                {activeSync.recordsProcessed} / {activeSync.totalRecords} records
              </p>
            </div>
          ) : (
            <p>{isConnected ? 'All data synced' : 'Real-time updates disconnected'}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
