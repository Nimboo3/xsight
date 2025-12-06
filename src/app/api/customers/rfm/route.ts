import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/customers/rfm
 * Returns RFM distribution data for demo mode
 */
export async function GET(request: NextRequest) {
  // Demo RFM distribution data
  const distribution = [
    { segment: 'Champions', count: 89, percentage: 10, color: '#22c55e' },
    { segment: 'Loyal', count: 156, percentage: 17.5, color: '#3b82f6' },
    { segment: 'Potential Loyalist', count: 178, percentage: 20, color: '#8b5cf6' },
    { segment: 'New Customers', count: 134, percentage: 15, color: '#06b6d4' },
    { segment: 'Promising', count: 98, percentage: 11, color: '#f59e0b' },
    { segment: 'Need Attention', count: 89, percentage: 10, color: '#f97316' },
    { segment: 'About to Sleep', count: 67, percentage: 7.5, color: '#ef4444' },
    { segment: 'At Risk', count: 45, percentage: 5, color: '#dc2626' },
    { segment: 'Hibernating', count: 36, percentage: 4, color: '#6b7280' },
  ];

  return NextResponse.json({
    distribution,
    totalCustomers: 892,
  });
}
