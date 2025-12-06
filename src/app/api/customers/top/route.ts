import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/customers/top
 * Returns top customers for demo mode
 */
export async function GET(request: NextRequest) {
  // Demo top customers data
  const customers = [
    {
      id: '1',
      email: 'john.smith@example.com',
      name: 'John Smith',
      totalOrders: 47,
      totalSpent: 8420.50,
      averageOrderValue: 179.16,
      rfmSegment: 'Champions',
      lastOrderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      email: 'sarah.j@example.com',
      name: 'Sarah Johnson',
      totalOrders: 35,
      totalSpent: 6890.25,
      averageOrderValue: 196.86,
      rfmSegment: 'Champions',
      lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      email: 'mike.w@example.com',
      name: 'Mike Wilson',
      totalOrders: 28,
      totalSpent: 4520.00,
      averageOrderValue: 161.43,
      rfmSegment: 'Loyal',
      lastOrderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      email: 'emily.d@example.com',
      name: 'Emily Davis',
      totalOrders: 22,
      totalSpent: 3890.75,
      averageOrderValue: 176.85,
      rfmSegment: 'Loyal',
      lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      email: 'alex.b@example.com',
      name: 'Alex Brown',
      totalOrders: 18,
      totalSpent: 2940.50,
      averageOrderValue: 163.36,
      rfmSegment: 'Potential Loyalist',
      lastOrderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return NextResponse.json({
    customers,
    total: 892,
  });
}
