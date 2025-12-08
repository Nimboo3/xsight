/**
 * API v1 Proxy Route
 * 
 * Proxies all /api/v1/* requests to the Express backend.
 * This is needed because:
 * 1. The Express backend handles all business logic
 * 2. Cookies are sent properly to same-origin requests
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string
): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const targetUrl = `${BACKEND_URL}/api/v1/${path}${url.search}`;

    const headers: HeadersInit = {
      'Cookie': request.headers.get('cookie') || '',
    };

    // Add content-type for requests with body
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // No body
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Get response data
    const data = await response.json().catch(() => ({}));

    // Create response with same status
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Forward any cookies from backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error(`[API Proxy] Error proxying ${method} /api/v1/${path}:`, error);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  return proxyRequest(request, path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  return proxyRequest(request, path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  return proxyRequest(request, path, 'DELETE');
}
