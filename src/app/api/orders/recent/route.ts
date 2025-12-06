import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/recent
 * Returns recent orders for demo mode
 */
export async function GET(request: NextRequest) {
  // Demo recent orders data
  const orders = [
    {
      id: 'ord_1001',
      orderNumber: '#1001',
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      totalAmount: 249.99,
      status: 'fulfilled',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      itemCount: 3,
    },
    {
      id: 'ord_1002',
      orderNumber: '#1002',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.j@example.com',
      totalAmount: 89.50,
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      itemCount: 1,
    },
    {
      id: 'ord_1003',
      orderNumber: '#1003',
      customerName: 'Mike Wilson',
      customerEmail: 'mike.w@example.com',
      totalAmount: 175.00,
      status: 'fulfilled',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      itemCount: 2,
    },
    {
      id: 'ord_1004',
      orderNumber: '#1004',
      customerName: 'Emily Davis',
      customerEmail: 'emily.d@example.com',
      totalAmount: 320.75,
      status: 'processing',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      itemCount: 4,
    },
    {
      id: 'ord_1005',
      orderNumber: '#1005',
      customerName: 'Alex Brown',
      customerEmail: 'alex.b@example.com',
      totalAmount: 156.25,
      status: 'fulfilled',
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      itemCount: 2,
    },
  ];

  return NextResponse.json({
    orders,
    total: 1247,
    page: 1,
    pageSize: 10,
  });
}
