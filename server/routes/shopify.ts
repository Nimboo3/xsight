/**
 * Shopify OAuth Routes
 * 
 * Handles Shopify store connection:
 * - GET /auth - Initiate OAuth (requires authenticated user)
 * - GET /auth/callback - Handle OAuth callback, link store to user
 */

import { Router, Request, Response } from 'express';
import { shopify } from '../lib/shopify';
import { prisma } from '../config/database';
import { logger } from '../lib/logger';
import { config } from '../config/env';
import { authRateLimiter, optionalAuthMiddleware } from '../middleware';
import { encrypt, decrypt, hash } from '../lib/crypto';
import { registerWebhooks } from '../services/webhooks';
import { customerSyncQueue, orderSyncQueue } from '../services/queue';
import { verifyJwt, JWT_COOKIE_NAME } from '../lib/jwt';

export const shopifyRouter = Router();

// Apply stricter rate limiting for auth routes
shopifyRouter.use(authRateLimiter);

/**
 * GET /auth
 * Initiate Shopify OAuth flow
 * 
 * Requires: Either JWT cookie OR oauth-init token in query
 * Query params: shop (e.g., my-store.myshopify.com), token (optional oauth-init token)
 */
shopifyRouter.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { shop, token: oauthToken } = req.query;

    // Validate shop parameter
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Check for authentication - either via cookie or oauth-init token
    let userId: string | null = null;
    
    // First try cookie
    const cookieToken = req.cookies?.[JWT_COOKIE_NAME];
    const cookiePayload = cookieToken ? verifyJwt(cookieToken) : null;
    
    if (cookiePayload) {
      userId = cookiePayload.userId;
    } else if (oauthToken && typeof oauthToken === 'string') {
      // Try oauth-init token (for ngrok redirects where cookies don't work)
      const tokenPayload = verifyJwt(oauthToken);
      if (tokenPayload && tokenPayload.purpose === 'oauth-init') {
        userId = tokenPayload.userId;
        logger.info({ userId }, 'Using oauth-init token for authentication');
      }
    }

    if (!userId) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/auth?shop=${shop}`);
      return res.redirect(`${config.frontendUrl}/auth/login?returnUrl=${returnUrl}`);
    }

    // Validate shop domain
    const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
    if (!sanitizedShop) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Check if this shop is already connected to another user
    // NOTE: If you see TypeScript errors about userId, run: npx prisma generate
    const existingTenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: sanitizedShop },
    }) as { userId?: string | null; shopifyDomain: string } | null;

    if (existingTenant && existingTenant.userId && existingTenant.userId !== userId) {
      // Store is already connected to a different user
      return res.redirect(
        `${config.frontendUrl}/connect?error=store_taken&shop=${sanitizedShop}`
      );
    }

    // Check if user already has a connected store
    const userTenant = await prisma.tenant.findFirst({
      where: { userId: userId } as any,
    }) as { shopifyDomain: string } | null;

    if (userTenant && userTenant.shopifyDomain !== sanitizedShop) {
      // User already has a different store connected (1:1 constraint)
      return res.redirect(
        `${config.frontendUrl}/connect?error=already_connected&currentShop=${userTenant.shopifyDomain}`
      );
    }

    // Store userId in state for callback - we need to pass this through the OAuth flow
    // The Shopify library manages its own state for CSRF, so we'll store userId in a cookie
    // that will be sent back on the callback
    const oauthStateCookie = Buffer.from(JSON.stringify({ userId })).toString('base64');
    res.cookie('oauth_state', oauthStateCookie, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 minutes
      path: '/',
    });

    logger.info({ shop: sanitizedShop, userId }, 'Starting Shopify OAuth');

    // Begin OAuth - this will redirect to Shopify
    // The library handles the redirect internally via rawResponse
    await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
    
    // Don't call res.redirect() - shopify.auth.begin() already sent the response
  } catch (error) {
    logger.error({ error }, 'OAuth begin error');
    if (!res.headersSent) {
      res.redirect(`${config.frontendUrl}/connect?error=oauth_failed`);
    }
  }
});

/**
 * GET /auth/callback
 * Handle Shopify OAuth callback
 * 
 * Links the Shopify store to the authenticated user.
 * User ID is recovered from oauth_state cookie set during auth.begin()
 */
shopifyRouter.get('/callback', async (req: Request, res: Response) => {
  try {
    const { shop, code, state } = req.query;

    if (!shop || !code) {
      return res.status(400).json({ error: 'Missing shop or code parameter' });
    }

    // Try to get userId from various sources
    let userId: string | null = null;
    
    // 1. Try oauth_state cookie (set during auth.begin())
    const oauthStateCookie = req.cookies?.oauth_state;
    if (oauthStateCookie) {
      try {
        const stateData = JSON.parse(Buffer.from(oauthStateCookie, 'base64').toString());
        if (stateData.userId) {
          userId = stateData.userId;
          logger.info({ userId }, 'Got userId from oauth_state cookie');
        }
      } catch (e) {
        logger.warn('Failed to parse oauth_state cookie');
      }
      // Clear the oauth_state cookie
      res.clearCookie('oauth_state', { path: '/' });
    }
    
    // 2. Try JWT cookie (same-domain flow)
    if (!userId) {
      const token = req.cookies?.[JWT_COOKIE_NAME];
      if (token) {
        const payload = verifyJwt(token);
        if (payload) {
          userId = payload.userId;
          logger.info({ userId }, 'Got userId from JWT cookie');
        }
      }
    }

    // Exchange the authorization code for an access token
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;

    // DEBUG: Log what we got from Shopify
    logger.info({ 
      shop: session.shop,
      hasAccessToken: !!session.accessToken,
      accessTokenLength: session.accessToken?.length || 0,
      scope: session.scope,
      sessionId: session.id,
    }, 'OAuth callback received session from Shopify');

    // 3. If we don't have userId, try to recover from existing tenant
    if (!userId) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { shopifyDomain: session.shop },
      }) as { userId?: string | null } | null;
      
      if (existingTenant?.userId) {
        userId = existingTenant.userId;
        logger.info({ shop: session.shop, userId }, 'Recovered userId from existing tenant');
      }
    }

    // If still no userId, we have a problem - user needs to re-authenticate
    if (!userId) {
      logger.warn({ shop: session.shop }, 'OAuth callback without user context');
      return res.redirect(
        `${config.frontendUrl}/auth/login?error=session_expired&returnUrl=${encodeURIComponent('/connect')}`
      );
    }

    // Store the Shopify session
    await prisma.session.upsert({
      where: { id: session.id },
      update: {
        shop: session.shop,
        state: session.state || '',
        isOnline: session.isOnline || false,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken || '',
      },
      create: {
        id: session.id,
        shop: session.shop,
        state: session.state || '',
        isOnline: session.isOnline || false,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken || '',
      },
    });

    // Encrypt access token
    const encryptedToken = session.accessToken
      ? encrypt(session.accessToken)
      : '';
    const tokenHash = session.accessToken
      ? hash(session.accessToken)
      : '';

    // Upsert tenant and link to user
    // NOTE: If TypeScript errors about userId, run: npx prisma generate
    const tenant = await prisma.tenant.upsert({
      where: { shopifyDomain: session.shop },
      update: {
        accessToken: encryptedToken,
        accessTokenHash: tokenHash,
        scope: session.scope?.split(',') || [],
        status: 'ACTIVE',
        userId: userId, // Link to authenticated user
      } as any,
      create: {
        shopifyDomain: session.shop,
        shopName: session.shop.replace('.myshopify.com', ''),
        accessToken: encryptedToken,
        accessTokenHash: tokenHash,
        scope: session.scope?.split(',') || [],
        status: 'ACTIVE',
        planTier: 'FREE',
        userId: userId, // Link to authenticated user
      } as any,
    });

    // Register webhooks in background
    registerWebhooks(tenant.id).catch((error) => {
      logger.error({ error, tenantId: tenant.id }, 'Failed to register webhooks');
    });

    // Queue initial sync jobs (use session.accessToken which is still plaintext)
    const plainAccessToken = session.accessToken || '';
    
    await customerSyncQueue.add(`initial-customer-sync:${tenant.id}`, {
      tenantId: tenant.id,
      shopDomain: session.shop,
      accessToken: plainAccessToken,
      mode: 'full',
    });

    await orderSyncQueue.add(`initial-order-sync:${tenant.id}`, {
      tenantId: tenant.id,
      shopDomain: session.shop,
      accessToken: plainAccessToken,
      mode: 'full',
    });

    logger.info(
      { shop: session.shop, userId, tenantId: tenant.id },
      'OAuth completed - Store linked to user'
    );

    // Redirect to dashboard
    res.redirect(`${config.frontendUrl}/app`);
  } catch (error: any) {
    logger.error({ 
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
    }, 'OAuth callback error');
    
    if (!res.headersSent) {
      res.redirect(`${config.frontendUrl}/connect?error=callback_failed`);
    }
  }
});

/**
 * POST /auth/disconnect
 * Disconnect Shopify store from user
 * 
 * Note: This doesn't revoke the Shopify access token, just unlinks from user.
 */
shopifyRouter.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];
    const payload = token ? verifyJwt(token) : null;

    if (!payload) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const currentUserId = payload.userId;

    // Find and update tenant
    // NOTE: If TypeScript errors about userId, run: npx prisma generate
    const tenant = await prisma.tenant.findFirst({
      where: { userId: currentUserId } as any,
      select: { id: true, shopifyDomain: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'No store connected' });
    }

    // Remove user link (keep tenant data for potential reconnection)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { userId: null } as any,
    });

    logger.info(
      { userId: currentUserId, tenantId: tenant.id },
      'Store disconnected from user'
    );

    res.json({ success: true, message: 'Store disconnected' });
  } catch (error) {
    logger.error({ error }, 'Disconnect error');
    res.status(500).json({ error: 'Failed to disconnect store' });
  }
});
