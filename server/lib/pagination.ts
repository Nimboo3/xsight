import { z } from 'zod';

/**
 * Cursor-based pagination helpers
 */

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string;
    prevCursor?: string;
    total?: number;
  };
}

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

/**
 * Encode a cursor from an ID and timestamp
 */
export function encodeCursor(id: string, timestamp: Date): string {
  const data = `${id}:${timestamp.toISOString()}`;
  return Buffer.from(data).toString('base64url');
}

/**
 * Decode a cursor to get ID and timestamp
 */
export function decodeCursor(cursor: string): { id: string; timestamp: Date } | null {
  try {
    const data = Buffer.from(cursor, 'base64url').toString('utf8');
    const [id, timestamp] = data.split(':');
    
    if (!id || !timestamp) {
      return null;
    }
    
    return {
      id,
      timestamp: new Date(timestamp),
    };
  } catch {
    return null;
  }
}

/**
 * Build a paginated result
 */
export function buildPaginatedResult<T extends { id: string; createdAt: Date }>(
  items: T[],
  limit: number,
  total?: number
): PaginatedResult<T> {
  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;
  
  const firstItem = data[0];
  const lastItem = data[data.length - 1];
  
  return {
    data,
    pagination: {
      hasNextPage,
      hasPrevPage: false, // Would need previous cursor to determine
      nextCursor: lastItem ? encodeCursor(lastItem.id, lastItem.createdAt) : undefined,
      prevCursor: firstItem ? encodeCursor(firstItem.id, firstItem.createdAt) : undefined,
      total,
    },
  };
}
