import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/login
 * Demo login endpoint for Vercel deployment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, demo } = body;

    // Demo mode login
    if (demo) {
      const response = NextResponse.json({
        success: true,
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
        redirect: '/app',
      });

      // Set demo mode cookie
      response.cookies.set('demo_mode', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      response.cookies.set('auth_token', 'demo-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For demo purposes, accept any login
    // In production, this would validate against the database
    const response = NextResponse.json({
      success: true,
      user: {
        id: 'user-' + Date.now(),
        email: email,
        name: email.split('@')[0],
      },
      tenant: null,
      redirect: '/app/connect',
    });

    response.cookies.set('auth_token', 'token-' + Date.now(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
