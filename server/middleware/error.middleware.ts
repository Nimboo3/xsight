import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { config } from '../config/env';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;
  const log = req.log || logger;
  
  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;
  
  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
    
    // Log based on status code
    if (statusCode >= 500) {
      log.error({ err, statusCode, errorCode }, message);
    } else {
      log.warn({ err, statusCode, errorCode }, message);
    }
  } else if (err instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    log.warn({ err, details }, 'Validation error');
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    const { code: prismaCode, meta } = err;
    
    switch (prismaCode) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = `A record with this ${(meta?.target as string[])?.join(', ') || 'value'} already exists`;
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = 'The requested record was not found';
        break;
      case 'P2003': // Foreign key constraint violation
        statusCode = 400;
        errorCode = 'INVALID_REFERENCE';
        message = 'Invalid reference to related record';
        break;
      default:
        statusCode = 500;
        errorCode = 'DATABASE_ERROR';
        message = 'A database error occurred';
    }
    
    log.error({ err, prismaCode, meta }, 'Prisma error');
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid database query';
    log.error({ err }, 'Prisma validation error');
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // JSON parse errors
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
    log.warn({ err }, 'JSON parse error');
  } else {
    // Unknown errors - log full stack trace
    log.error({ err, stack: err.stack }, 'Unhandled error');
    
    // In development, include more details
    if (config.isDev) {
      message = err.message;
      details = err.stack;
    }
  }
  
  const response: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      ...(requestId && { requestId }),
    },
  };
  
  res.status(statusCode).json(response);
}

/**
 * 404 handler for routes that don't exist
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
    },
  };
  
  res.status(404).json(response);
}
