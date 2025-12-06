import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
 * Demo signup endpoint for Vercel deployment
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

    // For demo purposes, create a mock user
    // In production, this would create a user in the database
    const response = NextResponse.json({
      success: true,
      user: {
        id: 'user-' + Date.now(),
        email: email,
        name: name || email.split('@')[0],
      },
      message: 'Account created successfully',
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}
