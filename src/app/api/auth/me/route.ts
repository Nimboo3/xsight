import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Express backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * GET /api/auth/me
 * Proxies to Express backend to get current user info
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('xsight_session')?.value;

    // No session token - not authenticated
    if (!sessionToken) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        tenant: null,
      });
    }

    // Proxy to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `xsight_session=${sessionToken}`,
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      tenant: null,
      error: 'Failed to check authentication',
    }, { status: 500 });
  }
}
