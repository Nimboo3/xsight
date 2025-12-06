import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logout endpoint
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('demo_mode', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
