/**
 * WebSocket Server - Socket.IO with Redis Pub/Sub
 * 
 * Provides real-time sync progress updates to connected clients.
 * 
 * Features:
 * - JWT authentication for socket connections
 * - Tenant-scoped rooms for multi-tenancy
 * - Redis Pub/Sub subscription for progress events
 * - Automatic cleanup on disconnect
 */

import { Server, Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { Server as HttpServer } from 'http';
import { verifyJwt } from '../lib/jwt';
import { logger } from '../lib/logger';
import { prisma } from '../config/database';
import {
  subscribeToSyncProgress,
  getSyncProgress,
  getActiveSyncRunsForTenant,
  SyncProgressEvent,
  SyncProgress,
} from '../lib/sync-progress';

const log = logger.child({ module: 'websocket' });

// Socket.IO server instance
let io: Server | null = null;

// Redis subscription cleanup function
let unsubscribeRedis: (() => Promise<void>) | null = null;

// Connected clients per tenant for debugging
const connectedClients: Map<string, Set<string>> = new Map();

// Client-specific sync subscriptions
const clientSubscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set<syncRunId>

/**
 * Socket authentication data from JWT
 */
interface SocketAuth {
  tenantId: string;
  userId?: string;
  shopDomain?: string;
}

/**
 * Extended socket with auth data
 */
interface AuthenticatedSocket extends Socket {
  auth: SocketAuth;
}

/**
 * Initialize Socket.IO server
 */
export function initializeWebSocket(httpServer: HttpServer): Server {
  log.info('Initializing WebSocket server...');

  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    },
    // Optimize for real-time updates
    pingTimeout: 60000,
    pingInterval: 25000,
    // Use WebSocket transport primarily
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: Socket, next: (err?: ExtendedError) => void) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const payload = verifyJwt(token as string);
      if (!payload || !payload.userId) {
        return next(new Error('Invalid token'));
      }

      // Get user with tenant relationship
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          tenant: {
            select: {
              id: true,
              shopifyDomain: true,
              status: true,
            },
          },
        },
      });

      if (!user || !user.tenant || user.tenant.status !== 'ACTIVE') {
        return next(new Error('No active tenant found'));
      }

      // Attach auth data to socket
      (socket as AuthenticatedSocket).auth = {
        tenantId: user.tenant.id,
        userId: user.id,
        shopDomain: user.tenant.shopifyDomain,
      };

      next();
    } catch (error) {
      log.error({ error }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { tenantId, shopDomain } = authSocket.auth;

    log.info({ socketId: socket.id, tenantId, shopDomain }, 'Client connected');

    // Track connected client
    if (!connectedClients.has(tenantId)) {
      connectedClients.set(tenantId, new Set());
    }
    connectedClients.get(tenantId)!.add(socket.id);

    // Initialize client subscriptions
    clientSubscriptions.set(socket.id, new Set());

    // Join tenant room for broadcasts
    socket.join(`tenant:${tenantId}`);

    // Send current active syncs on connection
    sendActiveSyncs(socket, tenantId);

    // Handle sync subscription requests
    socket.on('sync:subscribe', async (syncRunId: string) => {
      if (!syncRunId) return;

      log.debug({ socketId: socket.id, syncRunId }, 'Client subscribing to sync');

      // Validate sync belongs to tenant
      const progress = await getSyncProgress(syncRunId);
      if (progress && progress.tenantId === tenantId) {
        // Add to client's subscriptions
        clientSubscriptions.get(socket.id)?.add(syncRunId);
        
        // Join sync-specific room
        socket.join(`sync:${syncRunId}`);
        
        // Send current progress immediately
        socket.emit('sync:progress', progress);
      } else {
        socket.emit('sync:error', { syncRunId, error: 'Sync not found or access denied' });
      }
    });

    // Handle sync unsubscription
    socket.on('sync:unsubscribe', (syncRunId: string) => {
      if (!syncRunId) return;

      log.debug({ socketId: socket.id, syncRunId }, 'Client unsubscribing from sync');

      clientSubscriptions.get(socket.id)?.delete(syncRunId);
      socket.leave(`sync:${syncRunId}`);
    });

    // Handle manual progress request (polling fallback)
    socket.on('sync:status', async (syncRunId: string) => {
      if (!syncRunId) return;

      const progress = await getSyncProgress(syncRunId);
      if (progress && progress.tenantId === tenantId) {
        socket.emit('sync:progress', progress);
      } else {
        socket.emit('sync:error', { syncRunId, error: 'Sync not found' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      log.info({ socketId: socket.id, tenantId, reason }, 'Client disconnected');

      // Cleanup tracking
      connectedClients.get(tenantId)?.delete(socket.id);
      if (connectedClients.get(tenantId)?.size === 0) {
        connectedClients.delete(tenantId);
      }
      clientSubscriptions.delete(socket.id);
    });
  });

  // Subscribe to Redis Pub/Sub for sync progress
  unsubscribeRedis = subscribeToSyncProgress((event: SyncProgressEvent) => {
    handleSyncProgressEvent(event);
  });

  log.info('WebSocket server initialized');

  return io;
}

/**
 * Send active syncs to newly connected client
 */
async function sendActiveSyncs(socket: Socket, tenantId: string): Promise<void> {
  try {
    const activeSyncs = await getActiveSyncRunsForTenant(tenantId);
    if (activeSyncs.length > 0) {
      socket.emit('sync:active', activeSyncs);
    }
  } catch (error) {
    log.error({ error, tenantId }, 'Failed to send active syncs');
  }
}

/**
 * Handle sync progress events from Redis Pub/Sub
 */
function handleSyncProgressEvent(event: SyncProgressEvent): void {
  if (!io) return;

  const { data: progress } = event;
  const { syncRunId, tenantId } = progress;

  // Emit to sync-specific room
  io.to(`sync:${syncRunId}`).emit('sync:progress', progress);

  // Also emit to tenant room for dashboard updates
  io.to(`tenant:${tenantId}`).emit('sync:update', progress);

  // Log completion/failure events
  if (event.type === 'sync:completed') {
    log.info({ syncRunId, tenantId }, 'Sync completed - notifying clients');
    io.to(`tenant:${tenantId}`).emit('sync:completed', progress);
  } else if (event.type === 'sync:failed') {
    log.error({ syncRunId, tenantId, error: progress.error }, 'Sync failed - notifying clients');
    io.to(`tenant:${tenantId}`).emit('sync:failed', progress);
  }
}

/**
 * Broadcast a message to all clients of a tenant
 */
export function broadcastToTenant(tenantId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`tenant:${tenantId}`).emit(event, data);
}

/**
 * Get connected client count for a tenant
 */
export function getConnectedClientCount(tenantId: string): number {
  return connectedClients.get(tenantId)?.size || 0;
}

/**
 * Get total connected client count
 */
export function getTotalConnectedClients(): number {
  let total = 0;
  for (const clients of connectedClients.values()) {
    total += clients.size;
  }
  return total;
}

/**
 * Close WebSocket server gracefully
 */
export async function closeWebSocket(): Promise<void> {
  log.info('Closing WebSocket server...');

  // Unsubscribe from Redis
  if (unsubscribeRedis) {
    await unsubscribeRedis();
    unsubscribeRedis = null;
  }

  // Close Socket.IO
  if (io) {
    io.disconnectSockets(true);
    io.close();
    io = null;
  }

  // Clear tracking
  connectedClients.clear();
  clientSubscriptions.clear();

  log.info('WebSocket server closed');
}

/**
 * Get Socket.IO server instance
 */
export function getSocketIO(): Server | null {
  return io;
}

export default {
  initializeWebSocket,
  closeWebSocket,
  broadcastToTenant,
  getConnectedClientCount,
  getTotalConnectedClients,
  getSocketIO,
};
