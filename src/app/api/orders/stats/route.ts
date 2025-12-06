import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/stats
 * Returns order statistics for demo mode
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Demo data
  return NextResponse.json({
    stats: {
      totalOrders: 1247,
      totalRevenue: 156420.50,
      averageOrderValue: 125.40,
      totalCustomers: 892,
      conversionRate: 3.2,
      returningCustomerRate: 42.5,
    },
    period: {
      startDate: searchParams.get('startDate') || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: searchParams.get('endDate') || new Date().toISOString(),
    },
  });
}
