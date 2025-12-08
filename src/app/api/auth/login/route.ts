import { NextRequest, NextResponse } from 'next/server';

// Express backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * POST /api/auth/login
 * Proxies to Express backend for authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Proxy to Express backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendResponse.json();

    // Create response
    const response = NextResponse.json(data, { status: backendResponse.status });

    // Forward cookies from backend
    const setCookieHeader = backendResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse and forward each cookie
      const cookieParts = setCookieHeader.split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_]*=)/);
      for (const cookiePart of cookieParts) {
        const match = cookiePart.match(/^\s*([^=]+)=([^;]*)/); 
        if (match) {
          const [, name, value] = match;
          response.cookies.set(name.trim(), value.trim(), {
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
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
