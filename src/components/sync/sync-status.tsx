'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSyncStatus, useTriggerSync, type SyncJob } from '@/hooks/use-api';
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
  
  const handleTriggerSync = () => {
    triggerSync.mutate('all', {
      onSuccess: () => {
        // Refetch status after triggering
        setTimeout(() => refetch(), 1000);
      },
    });
  };

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
  
  // Check if any job is currently running
  const hasRunningJob = recentJobs.some(job => job.status === 'RUNNING');

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <div className={cn(
          'h-2 w-2 rounded-full',
          hasRunningJob ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
        )} />
        <span className="text-muted-foreground">
          {hasRunningJob ? 'Syncing...' : `Last sync: ${formatRelativeTime(lastSyncAt ?? null)}`}
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
        {recentJobs.length === 0 ? (
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
  
  if (isLoading) {
    return <Skeleton className={cn('h-4 w-20', className)} />;
  }
  
  const hasRunningJob = data?.data?.recentJobs?.some(job => job.status === 'RUNNING');
  
  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <div className={cn(
        'h-1.5 w-1.5 rounded-full',
        hasRunningJob ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
      )} />
      {hasRunningJob ? 'Syncing' : 'Synced'}
    </div>
  );
}
