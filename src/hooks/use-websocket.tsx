/**
 * WebSocket Hook - Real-time Sync Progress
 * 
 * Provides real-time sync progress updates via Socket.IO.
 * Falls back to REST polling if WebSocket connection fails.
 * 
 * Usage:
 * const { syncProgress, isConnected, subscribeToSync } = useSyncProgress();
 */

'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  ReactNode 
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';

// Sync progress data structure (matches backend)
export interface SyncProgress {
  syncRunId: string;
  tenantId: string;
  resourceType: 'customers' | 'orders' | 'all';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  step: string;
  recordsProcessed: number;
  totalRecords: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}

// WebSocket context value
interface WebSocketContextValue {
  isConnected: boolean;
  connectionError: string | null;
  activeSyncs: SyncProgress[];
  syncProgress: Map<string, SyncProgress>;
  subscribeToSync: (syncRunId: string) => void;
  unsubscribeFromSync: (syncRunId: string) => void;
  requestSyncStatus: (syncRunId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * WebSocket Provider Component
 * Manages socket connection and sync subscriptions
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated, tenant } = useAuth();
  const queryClient = useQueryClient();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeSyncs, setActiveSyncs] = useState<SyncProgress[]>([]);
  const [syncProgress, setSyncProgress] = useState<Map<string, SyncProgress>>(new Map());
  
  // Track subscribed sync runs
  const subscribedSyncs = useRef<Set<string>>(new Set());

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !tenant) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get WebSocket URL from API URL
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Get auth token from cookie for WebSocket authentication
    const authToken = Cookies.get('auth_token');

    const newSocket = io(wsUrl, {
      auth: { token: authToken },
      withCredentials: true, // Include cookies
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setConnectionError(null);

      // Re-subscribe to any active syncs
      subscribedSyncs.current.forEach(syncRunId => {
        newSocket.emit('sync:subscribe', syncRunId);
      });
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Sync events
    newSocket.on('sync:active', (syncs: SyncProgress[]) => {
      console.log('[WebSocket] Active syncs:', syncs);
      setActiveSyncs(syncs);
      
      // Update progress map
      setSyncProgress(prev => {
        const next = new Map(prev);
        syncs.forEach(sync => next.set(sync.syncRunId, sync));
        return next;
      });
    });

    newSocket.on('sync:progress', (progress: SyncProgress) => {
      console.log('[WebSocket] Sync progress:', progress.syncRunId, progress.progress);
      setSyncProgress(prev => {
        const next = new Map(prev);
        next.set(progress.syncRunId, progress);
        return next;
      });
    });

    newSocket.on('sync:update', (progress: SyncProgress) => {
      // Update for tenant-wide sync notifications
      setSyncProgress(prev => {
        const next = new Map(prev);
        next.set(progress.syncRunId, progress);
        return next;
      });
    });

    newSocket.on('sync:completed', (progress: SyncProgress) => {
      console.log('[WebSocket] Sync completed:', progress.syncRunId);
      
      // Update progress
      setSyncProgress(prev => {
        const next = new Map(prev);
        next.set(progress.syncRunId, progress);
        return next;
      });
      
      // Remove from active syncs
      setActiveSyncs(prev => prev.filter(s => s.syncRunId !== progress.syncRunId));
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'sync'] });
    });

    newSocket.on('sync:failed', (progress: SyncProgress) => {
      console.error('[WebSocket] Sync failed:', progress.syncRunId, progress.error);
      
      // Update progress
      setSyncProgress(prev => {
        const next = new Map(prev);
        next.set(progress.syncRunId, progress);
        return next;
      });
      
      // Remove from active syncs
      setActiveSyncs(prev => prev.filter(s => s.syncRunId !== progress.syncRunId));
      
      // Invalidate sync status
      queryClient.invalidateQueries({ queryKey: ['tenant', 'sync'] });
    });

    newSocket.on('sync:error', ({ syncRunId, error }: { syncRunId: string; error: string }) => {
      console.error('[WebSocket] Sync error:', syncRunId, error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, tenant, queryClient]);

  // Subscribe to a specific sync run
  const subscribeToSync = useCallback((syncRunId: string) => {
    if (!syncRunId) return;
    
    subscribedSyncs.current.add(syncRunId);
    
    if (socket && isConnected) {
      socket.emit('sync:subscribe', syncRunId);
    }
  }, [socket, isConnected]);

  // Unsubscribe from a specific sync run
  const unsubscribeFromSync = useCallback((syncRunId: string) => {
    if (!syncRunId) return;
    
    subscribedSyncs.current.delete(syncRunId);
    
    if (socket && isConnected) {
      socket.emit('sync:unsubscribe', syncRunId);
    }
    
    // Remove from local state
    setSyncProgress(prev => {
      const next = new Map(prev);
      next.delete(syncRunId);
      return next;
    });
  }, [socket, isConnected]);

  // Request sync status (manual polling fallback)
  const requestSyncStatus = useCallback((syncRunId: string) => {
    if (!syncRunId) return;
    
    if (socket && isConnected) {
      socket.emit('sync:status', syncRunId);
    }
  }, [socket, isConnected]);

  const value: WebSocketContextValue = {
    isConnected,
    connectionError,
    activeSyncs,
    syncProgress,
    subscribeToSync,
    unsubscribeFromSync,
    requestSyncStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

/**
 * Hook to subscribe to a specific sync run's progress
 */
export function useSyncRunProgress(syncRunId: string | null): {
  progress: SyncProgress | null;
  isSubscribed: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
} {
  const { syncProgress, subscribeToSync, unsubscribeFromSync, isConnected } = useWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribe = useCallback(() => {
    if (syncRunId) {
      subscribeToSync(syncRunId);
      setIsSubscribed(true);
    }
  }, [syncRunId, subscribeToSync]);

  const unsubscribe = useCallback(() => {
    if (syncRunId) {
      unsubscribeFromSync(syncRunId);
      setIsSubscribed(false);
    }
  }, [syncRunId, unsubscribeFromSync]);

  // Auto-subscribe when syncRunId changes
  useEffect(() => {
    if (syncRunId && isConnected) {
      subscribe();
    }
    
    return () => {
      if (syncRunId) {
        unsubscribe();
      }
    };
  }, [syncRunId, isConnected, subscribe, unsubscribe]);

  const progress = syncRunId ? syncProgress.get(syncRunId) || null : null;

  return {
    progress,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook to get all active syncs for the current tenant
 */
export function useActiveSyncs(): {
  activeSyncs: SyncProgress[];
  hasPendingSync: boolean;
  isConnected: boolean;
} {
  const { activeSyncs, isConnected } = useWebSocket();
  
  const hasPendingSync = activeSyncs.some(
    sync => sync.status === 'pending' || sync.status === 'running'
  );

  return {
    activeSyncs,
    hasPendingSync,
    isConnected,
  };
}
