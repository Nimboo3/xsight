/**
 * Sentry Error Tracking Configuration
 * 
 * Provides centralized error tracking and performance monitoring.
 * Integrates with Express error middleware for automatic error capture.
 * 
 * Compatible with Sentry v8.x
 */

import * as Sentry from '@sentry/node';
import { Application, Request, Response, NextFunction } from 'express';
import { config } from './env';
import { logger } from '../lib/logger';

const log = logger.child({ module: 'sentry' });

// Track if Sentry is initialized
let sentryInitialized = false;

/**
 * Initialize Sentry with configuration
 */
export function initializeSentry(app?: Application): void {
  if (!config.sentryDsn) {
    log.info('Sentry DSN not configured, skipping initialization');
    return;
  }

  if (sentryInitialized) {
    log.warn('Sentry already initialized');
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,
      release: process.env.npm_package_version || '1.0.0',
      
      // Performance Monitoring
      tracesSampleRate: config.isProd ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Integrations - v8 uses automatic instrumentation
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      
      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in development unless explicitly enabled
        if (config.isDev && !process.env.SENTRY_DEV_ENABLED) {
          return null;
        }
        
        // Filter out common non-actionable errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip validation errors (user input issues)
          if (error.name === 'ValidationError' || error.name === 'ZodError') {
            return null;
          }
          
          // Skip 404 errors
          if (error.message.includes('Not Found') || error.message.includes('404')) {
            return null;
          }
          
          // Skip rate limit errors (expected behavior)
          if (error.message.includes('Rate limit') || error.message.includes('Too many requests')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Attach additional context
      beforeSendTransaction(event) {
        // Add custom tags
        event.tags = {
          ...event.tags,
          service: 'xeno-shopify-api',
        };
        return event;
      },
    });

    sentryInitialized = true;
    log.info({ environment: config.nodeEnv }, 'Sentry initialized');
  } catch (error) {
    log.error({ error }, 'Failed to initialize Sentry');
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return sentryInitialized;
}

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string };
    tenantId?: string;
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
  }
): string | undefined {
  if (!sentryInitialized) {
    return undefined;
  }

  Sentry.withScope((scope) => {
    // Set user context
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
      });
    }

    // Set tenant context
    if (context?.tenantId) {
      scope.setTag('tenantId', context.tenantId);
    }

    // Add extra data
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    // Add custom tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
  });

  return Sentry.captureException(error);
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info',
  extra?: Record<string, unknown>
): string | undefined {
  if (!sentryInitialized) {
    return undefined;
  }

  Sentry.withScope((scope) => {
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
  });

  return Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for current scope
 */
export function setUser(user: { id: string; email?: string; tenantId?: string } | null): void {
  if (!sentryInitialized) {
    return;
  }

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
    if (user.tenantId) {
      Sentry.setTag('tenantId', user.tenantId);
    }
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Express error handler that captures exceptions to Sentry
 */
export function sentryErrorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!sentryInitialized) {
    return next(err);
  }

  // Add request context to Sentry
  Sentry.withScope((scope) => {
    // Request context
    scope.setExtra('url', req.url);
    scope.setExtra('method', req.method);
    scope.setExtra('headers', req.headers);
    scope.setExtra('query', req.query);
    scope.setExtra('requestId', req.requestId);

    // Tenant context (if available)
    if (req.tenant?.id) {
      scope.setTag('tenantId', req.tenant.id);
    }

    // Capture the exception
    Sentry.captureException(err);
  });

  next(err);
}

/**
 * Flush Sentry events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    await Sentry.close(timeout);
    log.info('Sentry flushed and closed');
  } catch (error) {
    log.error({ error }, 'Failed to flush Sentry');
  }
}

// Re-export Sentry for advanced usage
export { Sentry };
