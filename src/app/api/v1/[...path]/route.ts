import { NextRequest, NextResponse } from 'next/server';

/**
 * Catch-all API route for /api/v1/*
 * Returns demo data for all v1 endpoints
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join('/') || '';
  
  // Route to appropriate demo data
  switch (path) {
    case 'analytics/rfm':
    case 'customers/rfm':
      return NextResponse.json({
        distribution: [
          { segment: 'Champions', count: 89, totalSpent: 89420, avgSpent: 1004.72, percentage: 10 },
          { segment: 'Loyal', count: 156, totalSpent: 124800, avgSpent: 800, percentage: 17.5 },
          { segment: 'Potential Loyalist', count: 178, totalSpent: 89000, avgSpent: 500, percentage: 20 },
          { segment: 'New Customers', count: 134, totalSpent: 40200, avgSpent: 300, percentage: 15 },
          { segment: 'Promising', count: 98, totalSpent: 29400, avgSpent: 300, percentage: 11 },
          { segment: 'Need Attention', count: 89, totalSpent: 22250, avgSpent: 250, percentage: 10 },
          { segment: 'About to Sleep', count: 67, totalSpent: 13400, avgSpent: 200, percentage: 7.5 },
          { segment: 'At Risk', count: 45, totalSpent: 6750, avgSpent: 150, percentage: 5 },
          { segment: 'Hibernating', count: 36, totalSpent: 3600, avgSpent: 100, percentage: 4 },
        ],
        summary: {
          totalCustomers: 892,
          totalRevenue: 418820,
          segmentsWithCustomers: 9,
        },
      });

    case 'customers/top':
      return NextResponse.json({
        customers: [
          { id: '1', email: 'john.smith@example.com', name: 'John Smith', totalOrders: 47, totalSpent: 8420.50, rfmSegment: 'Champions' },
          { id: '2', email: 'sarah.j@example.com', name: 'Sarah Johnson', totalOrders: 35, totalSpent: 6890.25, rfmSegment: 'Champions' },
          { id: '3', email: 'mike.w@example.com', name: 'Mike Wilson', totalOrders: 28, totalSpent: 4520.00, rfmSegment: 'Loyal' },
          { id: '4', email: 'emily.d@example.com', name: 'Emily Davis', totalOrders: 22, totalSpent: 3890.75, rfmSegment: 'Loyal' },
          { id: '5', email: 'alex.b@example.com', name: 'Alex Brown', totalOrders: 18, totalSpent: 2940.50, rfmSegment: 'Potential Loyalist' },
        ],
        total: 892,
      });

    case 'orders/stats':
      return NextResponse.json({
        stats: {
          totalOrders: 1247,
          totalRevenue: 156420.50,
          averageOrderValue: 125.40,
          totalCustomers: 892,
        },
      });

    case 'orders/daily':
      const dailyData = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const orders = 30 + Math.floor(Math.random() * 20);
        const avgValue = 100 + Math.random() * 50;
        dailyData.push({
          date: date.toISOString().split('T')[0],
          orders,
          revenue: Math.round(orders * avgValue * 100) / 100,
        });
      }
      return NextResponse.json({ daily: dailyData });

    case 'orders/recent':
      return NextResponse.json({
        orders: [
          { id: '1', orderNumber: '#1001', customerName: 'John Smith', totalAmount: 249.99, status: 'fulfilled', createdAt: new Date().toISOString() },
          { id: '2', orderNumber: '#1002', customerName: 'Sarah Johnson', totalAmount: 89.50, status: 'pending', createdAt: new Date().toISOString() },
          { id: '3', orderNumber: '#1003', customerName: 'Mike Wilson', totalAmount: 175.00, status: 'fulfilled', createdAt: new Date().toISOString() },
        ],
        total: 1247,
      });

    default:
      // For customers list
      if (path === 'customers' || path.startsWith('customers')) {
        return NextResponse.json({
          customers: [
            { id: '1', email: 'john@example.com', name: 'John Smith', totalOrders: 15, totalSpent: 1250.00, rfmSegment: 'Champions' },
            { id: '2', email: 'sarah@example.com', name: 'Sarah Johnson', totalOrders: 8, totalSpent: 890.50, rfmSegment: 'Loyal' },
          ],
          total: 892,
          page: 1,
          pageSize: 20,
        });
      }

      // For orders list
      if (path === 'orders' || path.startsWith('orders')) {
        return NextResponse.json({
          orders: [
            { id: '1', orderNumber: '#1001', customerName: 'John Smith', totalAmount: 249.99, status: 'fulfilled' },
            { id: '2', orderNumber: '#1002', customerName: 'Sarah Johnson', totalAmount: 89.50, status: 'pending' },
          ],
          total: 1247,
          page: 1,
          pageSize: 20,
        });
      }

      // Default response
      return NextResponse.json({ message: `Demo endpoint: ${path}`, data: [] });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Handle POST requests with demo responses
  return NextResponse.json({ success: true, message: 'Demo mode - action simulated' });
}
