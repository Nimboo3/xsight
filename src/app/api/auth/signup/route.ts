import { NextRequest, NextResponse } from 'next/server';

// Express backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * POST /api/auth/signup
 * Proxies to Express backend for user registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Proxy to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await backendResponse.json();
    const response = NextResponse.json(data, { status: backendResponse.status });

    // Forward cookies from backend
    const setCookieHeader = backendResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieParts = setCookieHeader.split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_]*=)/);
      for (const cookiePart of cookieParts) {
        const match = cookiePart.match(/^\s*([^=]+)=([^;]*)/);
        if (match) {
          const [, cookieName, cookieValue] = match;
          response.cookies.set(cookieName.trim(), cookieValue.trim(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          });
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Signup proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed. Please try again.' },
      { status: 500 }
    );
  }
}
