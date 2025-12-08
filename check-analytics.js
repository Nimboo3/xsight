/**
 * Quick check of analytics data in the database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get tenant
  const tenant = await prisma.tenant.findFirst();
  console.log('Tenant:', tenant?.id, tenant?.shop);

  if (!tenant) {
    console.log('No tenant found');
    return;
  }

  // Get customer stats
  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      email: true,
      ordersCount: true,
      totalSpent: true,
      lastOrderDate: true,
      rfmSegment: true,
    },
    take: 10,
  });
  console.log('\nCustomers:', customers.length);
  console.log('Sample customers:');
  customers.slice(0, 3).forEach(c => {
    console.log(`  - ${c.email}: ${c.ordersCount} orders, $${c.totalSpent}, segment: ${c.rfmSegment}, lastOrder: ${c.lastOrderDate}`);
  });

  // Get order stats
  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      orderNumber: true,
      orderDate: true,
      totalPrice: true,
      financialStatus: true,
    },
    take: 10,
    orderBy: { orderDate: 'desc' },
  });
  console.log('\nOrders:', orders.length);
  console.log('Recent orders:');
  orders.slice(0, 5).forEach(o => {
    console.log(`  - #${o.orderNumber}: $${o.totalPrice} on ${o.orderDate} (${o.financialStatus})`);
  });

  // Count customers by segment
  const segmentCounts = await prisma.customer.groupBy({
    by: ['rfmSegment'],
    where: { tenantId: tenant.id },
    _count: { id: true },
  });
  console.log('\nSegment distribution:');
  segmentCounts.forEach(s => {
    console.log(`  - ${s.rfmSegment || 'No Segment'}: ${s._count.id} customers`);
  });

  // Order date range
  const orderDates = await prisma.order.aggregate({
    where: { tenantId: tenant.id },
    _min: { orderDate: true },
    _max: { orderDate: true },
  });
  console.log('\nOrder date range:');
  console.log(`  Min: ${orderDates._min.orderDate}`);
  console.log(`  Max: ${orderDates._max.orderDate}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
