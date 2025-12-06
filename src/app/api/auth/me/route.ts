import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/me
 * Returns current user info (demo mode for Vercel deployment)
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  const demoMode = cookieStore.get('demo_mode')?.value;

  // Demo mode - return mock user
  if (demoMode === 'true') {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'demo-user-id',
        email: 'demo@example.com',
        name: 'Demo User',
      },
      tenant: {
        id: 'demo-tenant-id',
        shopDomain: 'demo-store.myshopify.com',
        shopName: 'Demo Store',
      },
    });
  }

  // No auth - return unauthenticated
  if (!token) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      tenant: null,
    });
  }

  // For real auth, we'd verify JWT here
  // For now, just return authenticated if token exists
  return NextResponse.json({
    authenticated: true,
    user: {
      id: 'user-from-token',
      email: 'user@example.com',
      name: 'User',
    },
    tenant: null,
  });
}
