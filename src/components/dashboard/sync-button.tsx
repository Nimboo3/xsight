'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SyncButtonProps {
  onSyncComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function SyncButton({ 
  onSyncComplete, 
  variant = 'outline',
  size = 'sm',
  showLabel = true 
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/v1/tenants/me/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resource: 'all', mode: 'full' }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sync Started',
          description: 'Your data is being synced from Shopify. This may take a few minutes.',
        });
        
        // Invalidate all cached queries to force fresh data on next fetch
        // This ensures the UI reflects the latest data after sync completes
        setTimeout(async () => {
          await queryClient.invalidateQueries();
          onSyncComplete?.();
        }, 3000);
      } else {
        throw new Error(data.error?.message || 'Sync failed');
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to start sync',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
      title="Sync data from Shopify"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {showLabel && (isSyncing ? 'Syncing...' : 'Sync')}
    </Button>
  );
}
