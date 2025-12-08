/**
 * Centralized API Configuration
 * 
 * For local development:
 * - Next.js API routes proxy to Express backend
 * - All API calls use relative URLs
 * 
 * For production (Vercel + Railway):
 * - Set NEXT_PUBLIC_API_URL to your Railway backend URL
 * - API calls will go directly to Express backend
 */

// API base URL
// - Empty string = relative URLs (local dev, uses Next.js API proxy)
// - Full URL = production (direct calls to Railway backend)
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Check if we're using external API (production) or local proxy
export const isProductionMode = !!process.env.NEXT_PUBLIC_API_URL;

// API version prefix
export const API_VERSION = '/api/v1';

// Auth endpoints prefix
export const AUTH_PREFIX = '/api/auth';

/**
 * Get the full URL for an API endpoint
 * @param endpoint - The endpoint path (e.g., '/customers', '/orders/stats')
 * @param prefix - The prefix to use (defaults to API_VERSION)
 */
export function getApiUrl(endpoint: string, prefix: string = API_VERSION): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${prefix}${normalizedEndpoint}`;
}

/**
 * Get the full URL for an auth endpoint
 * @param endpoint - The auth endpoint path (e.g., '/login', '/me')
 */
export function getAuthUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${AUTH_PREFIX}${normalizedEndpoint}`;
}

/**
 * Default fetch options for API calls
 * - credentials: 'include' ensures cookies are sent (for httpOnly JWT auth)
 * - Content-Type: 'application/json' for JSON payloads
 */
export const defaultFetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Check if we're running on the server side
 */
export const isServer = typeof window === 'undefined';

/**
 * Environment info for debugging
 */
export function getEnvInfo() {
  return {
    isDemoMode: false,
    apiBase: API_BASE,
    apiVersion: API_VERSION,
    isServer,
    nodeEnv: process.env.NODE_ENV,
  };
}
