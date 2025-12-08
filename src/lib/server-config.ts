/**
 * Server-side API Configuration
 * 
 * This module determines whether the app runs in demo mode or production mode.
 * Used by Next.js API routes to decide between mock data and real database queries.
 * 
 * Demo Mode is AUTOMATICALLY enabled when:
 * - NEXT_PUBLIC_DEMO_MODE is explicitly set to 'true', OR
 * - DATABASE_URL is not configured (auto-detection for easy deployment)
 * 
 * This allows zero-config demo deployment on Vercel while supporting
 * full production deployment when environment variables are set.
 */

/**
 * Check if we're in demo mode (server-side)
 * 
 * Priority:
 * 1. Explicit NEXT_PUBLIC_DEMO_MODE=true → demo mode
 * 2. Explicit NEXT_PUBLIC_DEMO_MODE=false → production mode (requires DATABASE_URL)
 * 3. No NEXT_PUBLIC_DEMO_MODE set → auto-detect based on DATABASE_URL availability
 */
export function isDemoMode(): boolean {
  const explicitDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;
  
  // Explicit demo mode setting takes precedence
  if (explicitDemoMode === 'true') {
    return true;
  }
  
  if (explicitDemoMode === 'false') {
    return false;
  }
  
  // Auto-detect: if no DATABASE_URL, we're in demo mode
  const hasDatabase = !!process.env.DATABASE_URL;
  return !hasDatabase;
}

/**
 * Check if database is available (server-side only)
 */
export function hasDatabaseConnection(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Get environment info for debugging (safe to expose)
 */
export function getServerEnvInfo() {
  return {
    isDemoMode: isDemoMode(),
    hasDatabase: hasDatabaseConnection(),
    nodeEnv: process.env.NODE_ENV,
    // Don't expose actual URLs or secrets
  };
}

/**
 * Throw an error if production mode is requested but database is not configured
 */
export function requireDatabase(): void {
  if (isDemoMode()) {
    return; // Demo mode doesn't need database
  }
  
  if (!hasDatabaseConnection()) {
    throw new Error(
      'Production mode requires DATABASE_URL. ' +
      'Either set DATABASE_URL or set NEXT_PUBLIC_DEMO_MODE=true for demo mode.'
    );
  }
}
