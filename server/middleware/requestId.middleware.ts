import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: typeof logger;
    }
  }
}

/**
 * Adds a unique request ID to each request
 * Also attaches a child logger with the request ID
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  
  req.requestId = requestId;
  req.log = logger.child({ requestId });
  
  // Add to response headers for tracing
  res.setHeader('x-request-id', requestId);
  
  next();
}
