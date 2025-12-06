import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders/daily
 * Returns daily order statistics for charts
 */
export async function GET(request: NextRequest) {
  // Generate demo daily data for the last 30 days
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate some realistic-looking random data
    const baseOrders = 30 + Math.floor(Math.random() * 20);
    const weekday = date.getDay();
    const weekendBonus = (weekday === 0 || weekday === 6) ? 1.3 : 1;
    const orders = Math.floor(baseOrders * weekendBonus);
    const avgValue = 100 + Math.random() * 50;
    
    data.push({
      date: date.toISOString().split('T')[0],
      orders,
      revenue: Math.round(orders * avgValue * 100) / 100,
      averageOrderValue: Math.round(avgValue * 100) / 100,
    });
  }
  
  return NextResponse.json({
    daily: data,
  });
}
