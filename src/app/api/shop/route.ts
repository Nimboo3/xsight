import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/shop
 * Returns shop/tenant info for demo mode
 */
export async function GET(request: NextRequest) {
  // Demo mode - return mock shop data
  return NextResponse.json({
    shop: {
      id: 'demo-shop-id',
      domain: 'demo-store.myshopify.com',
      name: 'Demo Store',
      email: 'demo@example.com',
      currency: 'USD',
    },
  });
}
