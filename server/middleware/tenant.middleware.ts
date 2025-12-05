import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { UnauthorizedError, NotFoundError } from '../lib/errors';
import { verifyOAuthRequest } from '../lib/hmac';
import { config } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        shopifyDomain: string;
        accessToken: string;
        planTier: string;
      };
      shopDomain?: string;
    }
  }
}

/**
 * Extract tenant information from the shop domain in query params or session
 * Used for Shopify embedded app requests
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get shop domain from query params or headers
    const shopDomain = 
      (req.query.shop as string) || 
      (req.headers['x-shopify-shop-domain'] as string);
    
    if (!shopDomain) {
      throw new UnauthorizedError('Shop domain is required');
    }
    
    // Validate shop domain format
    if (!isValidShopDomain(shopDomain)) {
      throw new UnauthorizedError('Invalid shop domain format');
    }
    
    req.shopDomain = shopDomain;
    
    // Look up tenant by shop domain
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: shopDomain },
      select: {
        id: true,
        shopifyDomain: true,
        accessToken: true,
        planTier: true,
        status: true,
      },
    });
    
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }
    
    if (tenant.status !== 'ACTIVE') {
      throw new UnauthorizedError('Tenant is not active');
    }
    
    if (!tenant.accessToken) {
      throw new UnauthorizedError('Tenant access token not found');
    }
    
    req.tenant = {
      id: tenant.id,
      shopifyDomain: tenant.shopifyDomain,
      accessToken: tenant.accessToken,
      planTier: tenant.planTier,
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Verify Shopify OAuth signature for app bridge requests
 */
export async function verifyShopifyRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { shop, timestamp, signature, ...rest } = req.query as Record<string, string>;
    
    if (!shop || !timestamp || !signature) {
      throw new UnauthorizedError('Missing required Shopify query parameters');
    }
    
    // Verify the request signature
    const isValid = verifyOAuthRequest(
      { shop, timestamp, ...rest },
      signature,
      config.shopifyApiSecret
    );
    
    if (!isValid) {
      throw new UnauthorizedError('Invalid Shopify request signature');
    }
    
    // Check timestamp is within 5 minutes
    const requestTime = parseInt(timestamp, 10) * 1000;
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (Math.abs(currentTime - requestTime) > fiveMinutes) {
      throw new UnauthorizedError('Request timestamp expired');
    }
    
    req.shopDomain = shop;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate shop domain format
 */
function isValidShopDomain(domain: string): boolean {
  // Shopify domains: xxx.myshopify.com
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopifyDomainRegex.test(domain);
}

/**
 * Optional tenant middleware - doesn't throw if no tenant found
 */
export async function optionalTenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shopDomain = 
      (req.query.shop as string) || 
      (req.headers['x-shopify-shop-domain'] as string);
    
    if (!shopDomain || !isValidShopDomain(shopDomain)) {
      return next();
    }
    
    req.shopDomain = shopDomain;
    
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: shopDomain },
      select: {
        id: true,
        shopifyDomain: true,
        accessToken: true,
        planTier: true,
        status: true,
      },
    });
    
    if (tenant && tenant.status === 'ACTIVE' && tenant.accessToken) {
      req.tenant = {
        id: tenant.id,
        shopifyDomain: tenant.shopifyDomain,
        accessToken: tenant.accessToken,
        planTier: tenant.planTier,
      };
    }
    
    next();
  } catch (error) {
    // Log but don't fail - this is optional
    req.log?.warn({ error }, 'Failed to load optional tenant');
    next();
  }
}
