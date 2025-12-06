/**
 * Shopify Session Token Utilities
 * 
 * Used when the app is embedded in Shopify Admin.
 * Session tokens are JWTs issued by Shopify that prove the user's identity.
 * 
 * @see https://shopify.dev/docs/apps/auth/session-tokens
 */

import { shopify } from './shopify';
import { logger } from './logger';

/**
 * Shopify Session Token payload structure
 * These tokens are signed by Shopify and can be verified using the app's API secret
 */
export interface SessionTokenPayload {
  /** Issuer - The shop's admin URL (e.g., "https://admin.shopify.com/store/my-store") */
  iss: string;
  /** Destination - The shop URL (e.g., "https://my-store.myshopify.com") */
  dest: string;
  /** Audience - The app's API key */
  aud: string;
  /** Subject - The user ID who generated the token */
  sub: string;
  /** Expiration timestamp */
  exp: number;
  /** Not before timestamp */
  nbf: number;
  /** Issued at timestamp */
  iat: number;
  /** JWT ID - Unique token identifier */
  jti: string;
  /** Session ID */
  sid: string;
}

/**
 * Verify a Shopify session token
 * 
 * This validates the token was signed by Shopify using our app's credentials.
 * Returns null if the token is invalid, expired, or malformed.
 */
export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    // Shopify's SDK handles verification using the API secret
    const payload = await shopify.session.decodeSessionToken(token);
    return payload as unknown as SessionTokenPayload;
  } catch (error) {
    logger.debug({ error }, 'Session token verification failed');
    return null;
  }
}

/**
 * Extract the shop domain from a session token payload
 * 
 * The `dest` field contains the shop URL (e.g., "https://my-store.myshopify.com")
 * We extract just the hostname.
 */
export function extractShopFromPayload(payload: SessionTokenPayload): string {
  try {
    const url = new URL(payload.dest);
    return url.hostname;
  } catch {
    // Fallback: try to extract from iss if dest fails
    // iss is like "https://admin.shopify.com/store/my-store"
    const match = payload.iss.match(/\/store\/([^/]+)/);
    if (match) {
      return `${match[1]}.myshopify.com`;
    }
    throw new Error('Could not extract shop from session token');
  }
}

/**
 * Check if a session token is about to expire
 * Returns true if token expires within the threshold (default 5 minutes)
 */
export function isTokenExpiringSoon(payload: SessionTokenPayload, thresholdMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const expiresAt = payload.exp * 1000; // exp is in seconds
  return expiresAt - now < thresholdMs;
}
