/**
 * JWT Utilities for User Authentication
 * 
 * Provides stateless authentication via HTTP-only cookies.
 * JWT contains user info; tenant is looked up from user relation.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// JWT payload structure - User-based (not tenant-based)
export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Token expiration
const JWT_EXPIRES_IN = '7d';

/**
 * Sign a JWT token for a user
 */
export function signJwt(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, config.jwtSecret, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid or expired
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

// Cookie configuration
export const JWT_COOKIE_NAME = 'shopsight_session';

export const JWT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};
