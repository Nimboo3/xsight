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
 * Requires: Authenticated user (via JWT cookie)
 * Query params: shop (e.g., my-store.myshopify.com)
 */
shopifyRouter.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { shop } = req.query;

    // Validate shop parameter
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Check if user is authenticated
    const token = req.cookies?.[JWT_COOKIE_NAME];
    const payload = token ? verifyJwt(token) : null;

    if (!payload) {
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
    const existingTenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: sanitizedShop },
      select: { userId: true, shopifyDomain: true },
    });

    if (existingTenant && existingTenant.userId && existingTenant.userId !== payload.userId) {
      // Store is already connected to a different user
      return res.redirect(
        `${config.frontendUrl}/app/connect?error=store_taken&shop=${sanitizedShop}`
      );
    }

    // Check if user already has a connected store
    const userTenant = await prisma.tenant.findUnique({
      where: { userId: payload.userId },
      select: { shopifyDomain: true },
    });

    if (userTenant && userTenant.shopifyDomain !== sanitizedShop) {
      // User already has a different store connected (1:1 constraint)
      return res.redirect(
        `${config.frontendUrl}/app/connect?error=already_connected&currentShop=${userTenant.shopifyDomain}`
      );
    }

    // Store userId in state for callback (base64 encoded)
    const stateData = { userId: payload.userId };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Begin OAuth
    const authUrl = await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    logger.info({ shop: sanitizedShop, userId: payload.userId }, 'Starting Shopify OAuth');

    res.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'OAuth begin error');
    res.redirect(`${config.frontendUrl}/app/connect?error=oauth_failed`);
  }
});

/**
 * GET /auth/callback
 * Handle Shopify OAuth callback
 * 
 * Links the Shopify store to the authenticated user.
 */
shopifyRouter.get('/callback', async (req: Request, res: Response) => {
  try {
    const { shop, code, state } = req.query;

    if (!shop || !code) {
      return res.status(400).json({ error: 'Missing shop or code parameter' });
    }

    // Get user from JWT cookie
    const token = req.cookies?.[JWT_COOKIE_NAME];
    const payload = token ? verifyJwt(token) : null;

    if (!payload) {
      // User not authenticated - redirect to login
      return res.redirect(`${config.frontendUrl}/auth/login?error=auth_required`);
    }

    // Exchange the authorization code for an access token
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;

    // Store the Shopify session
    await prisma.shopifySession.upsert({
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
    const tenant = await prisma.tenant.upsert({
      where: { shopifyDomain: session.shop },
      update: {
        accessToken: encryptedToken,
        accessTokenHash: tokenHash,
        scope: session.scope?.split(',') || [],
        status: 'ACTIVE',
        userId: payload.userId, // Link to authenticated user
      },
      create: {
        shopifyDomain: session.shop,
        shopName: session.shop.replace('.myshopify.com', ''),
        accessToken: encryptedToken,
        accessTokenHash: tokenHash,
        scope: session.scope?.split(',') || [],
        status: 'ACTIVE',
        planTier: 'FREE',
        userId: payload.userId, // Link to authenticated user
      },
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
      { shop: session.shop, userId: payload.userId, tenantId: tenant.id },
      'OAuth completed - Store linked to user'
    );

    // Redirect to dashboard
    res.redirect(`${config.frontendUrl}/app`);
  } catch (error) {
    logger.error({ error }, 'OAuth callback error');
    res.redirect(`${config.frontendUrl}/app/connect?error=callback_failed`);
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

    // Find and update tenant
    const tenant = await prisma.tenant.findUnique({
      where: { userId: payload.userId },
      select: { id: true, shopifyDomain: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'No store connected' });
    }

    // Remove user link (keep tenant data for potential reconnection)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { userId: null },
    });

    logger.info(
      { userId: payload.userId, tenantId: tenant.id },
      'Store disconnected from user'
    );

    res.json({ success: true, message: 'Store disconnected' });
  } catch (error) {
    logger.error({ error }, 'Disconnect error');
    res.status(500).json({ error: 'Failed to disconnect store' });
  }
});
