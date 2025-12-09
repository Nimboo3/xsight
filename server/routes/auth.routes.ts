/**
 * Authentication Routes
 * 
 * Email-based user authentication:
 * - POST /api/auth/signup - Register new user
 * - POST /api/auth/login - Login with email/password
 * - POST /api/auth/logout - Clear session
 * - GET /api/auth/me - Get current user info
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { signJwt, verifyJwt, JWT_COOKIE_NAME, JWT_COOKIE_OPTIONS } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { logger } from '../lib/logger';

export const authRouter: Router = Router();

const log = logger.child({ module: 'auth-routes' });

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate input
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors.map(e => ({ field: e.path[0], message: e.message })),
      });
    }

    const { email, password, name } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Issue JWT
    const token = signJwt({ userId: user.id, email: user.email });
    res.cookie(JWT_COOKIE_NAME, token, JWT_COOKIE_OPTIONS);

    log.info({ userId: user.id, email: user.email }, 'User signed up');

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    log.error({ error }, 'Signup error');
    res.status(500).json({
      success: false,
      error: 'Failed to create account. Please try again.',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors.map(e => ({ field: e.path[0], message: e.message })),
      });
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        tenant: {
          select: {
            id: true,
            shopifyDomain: true,
            shopName: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      // Use same error message to prevent email enumeration
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Issue JWT
    const token = signJwt({ userId: user.id, email: user.email });
    res.cookie(JWT_COOKIE_NAME, token, JWT_COOKIE_OPTIONS);

    log.info({ userId: user.id, email: user.email }, 'User logged in');

    // Determine redirect based on tenant status
    const hasStore = user.tenant && user.tenant.status === 'ACTIVE';

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tenant: hasStore ? {
        id: user.tenant!.id,
        shopDomain: user.tenant!.shopifyDomain,
        shopName: user.tenant!.shopName,
      } : null,
      redirect: hasStore ? '/app' : '/connect',
    });
  } catch (error) {
    log.error({ error }, 'Login error');
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Clear session cookie
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie(JWT_COOKIE_NAME, {
    ...JWT_COOKIE_OPTIONS,
    maxAge: 0,
  });

  log.info('User logged out');

  res.json({ success: true });
});

/**
 * GET /api/auth/me
 * Get current user and tenant info
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      return res.json({
        authenticated: false,
        user: null,
        tenant: null,
      });
    }

    const payload = verifyJwt(token);

    if (!payload) {
      return res.json({
        authenticated: false,
        user: null,
        tenant: null,
      });
    }

    // Get user with tenant
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        tenant: {
          select: {
            id: true,
            shopifyDomain: true,
            shopName: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return res.json({
        authenticated: false,
        user: null,
        tenant: null,
      });
    }

    const tenant = user.tenant && user.tenant.status === 'ACTIVE' ? {
      id: user.tenant.id,
      shopDomain: user.tenant.shopifyDomain,
      shopName: user.tenant.shopName,
    } : null;

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tenant,
    });
  } catch (error) {
    log.error({ error }, 'Error checking auth status');
    res.json({
      authenticated: false,
      user: null,
      tenant: null,
    });
  }
});

/**
 * POST /api/auth/oauth-token
 * Generate a short-lived token for OAuth initiation
 * 
 * This is needed because when redirecting to ngrok URL, cookies won't be sent.
 * The frontend gets this token via local proxy, then passes it to ngrok URL.
 */
authRouter.post('/oauth-token', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = verifyJwt(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { shop } = req.body;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Create a short-lived token (5 minutes) for OAuth initiation
    const oauthToken = signJwt(
      { userId: payload.userId, shop, purpose: 'oauth-init' },
      '5m'
    );

    log.info({ userId: payload.userId, shop }, 'Generated OAuth initiation token');

    res.json({ token: oauthToken });
  } catch (error) {
    log.error({ error }, 'Error generating OAuth token');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/status
 * Quick auth check (lighter than /me)
 */
authRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      return res.json({ authenticated: false });
    }

    const payload = verifyJwt(token);
    
    if (!payload) {
      return res.json({ authenticated: false });
    }

    // Quick check if user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    });

    res.json({ authenticated: !!user });
  } catch (error) {
    res.json({ authenticated: false });
  }
});
