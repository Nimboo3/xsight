/**
 * OAuth Token API Route (Proxy to Express Backend)
 * 
 * Gets a short-lived token for Shopify OAuth initiation.
 * This is needed because when redirecting to ngrok, cookies won't be sent.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the Express backend
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/auth/oauth-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('OAuth token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
