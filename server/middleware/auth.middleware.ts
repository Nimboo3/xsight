/**
 * Authentication Middleware
 * 
 * User-based authentication using JWT cookies.
 * - authMiddleware: Requires authenticated user
 * - tenantMiddleware: Requires user with connected store
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyJwt, JWT_COOKIE_NAME } from '../lib/jwt';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * User info attached to request
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Tenant info attached to request
 */
export interface TenantInfo {
  id: string;
  shopifyDomain: string;
  accessToken: string;
  planTier: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      tenant?: TenantInfo;
    }
  }
}

/**
 * Authentication Middleware
 * 
 * Verifies JWT cookie and attaches user info to request.
 * Throws UnauthorizedError if not authenticated.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    const payload = verifyJwt(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired session. Please log in again.');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found. Please log in again.');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    logger.debug({ userId: user.id }, 'User authenticated');

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Tenant Middleware
 * 
 * Requires authenticated user with a connected Shopify store.
 * Must be used after authMiddleware.
 * Throws ForbiddenError if user has no connected store.
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    // Get user's tenant
    // NOTE: If TypeScript errors about userId, run: npx prisma generate
    const tenant = await prisma.tenant.findFirst({
      where: { userId: req.user.id } as any,
      select: {
        id: true,
        shopifyDomain: true,
        accessToken: true,
        planTier: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new ForbiddenError('No Shopify store connected. Please connect your store first.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenError('Your store connection is inactive. Please reconnect.');
    }

    // Attach tenant to request
    req.tenant = {
      id: tenant.id,
      shopifyDomain: tenant.shopifyDomain,
      accessToken: tenant.accessToken,
      planTier: tenant.planTier,
    };

    logger.debug({ userId: req.user.id, tenantId: tenant.id }, 'Tenant context set');

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Combined Auth + Tenant Middleware
 * 
 * Convenience middleware that requires both authentication and a connected store.
 * Use this for API routes that need tenant context.
 */
export async function authWithTenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // First authenticate user
  authMiddleware(req, res, (error) => {
    if (error) {
      return next(error);
    }
    // Then check for tenant
    tenantMiddleware(req, res, next);
  });
}

/**
 * Optional Auth Middleware
 * 
 * Tries to authenticate but doesn't fail if not authenticated.
 * Useful for endpoints that work with or without authentication.
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      return next();
    }

    const payload = verifyJwt(token);

    if (!payload) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }

    next();
  } catch (error) {
    // Swallow errors for optional auth
    next();
  }
}
