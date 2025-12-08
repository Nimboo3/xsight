/**
 * Fix order dates to be before December 6, 2025
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrderDates() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }

  const cutoffDate = new Date('2025-12-05T23:59:59Z');
  console.log('Cutoff date:', cutoffDate);

  // Find orders after Dec 5
  const ordersAfterCutoff = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      orderDate: { gt: cutoffDate },
    },
    select: { id: true, orderNumber: true, orderDate: true },
  });

  console.log(`Found ${ordersAfterCutoff.length} orders after cutoff date`);

  if (ordersAfterCutoff.length === 0) {
    console.log('No orders need fixing');
    return;
  }

  // Move each order to a random date between Dec 1-5
  for (const order of ordersAfterCutoff) {
    const randomDay = Math.floor(Math.random() * 5) + 1; // 1-5
    const randomHour = Math.floor(Math.random() * 24);
    const randomMin = Math.floor(Math.random() * 60);
    const newDate = new Date(Date.UTC(2025, 11, randomDay, randomHour, randomMin, 0));

    await prisma.order.update({
      where: { id: order.id },
      data: { orderDate: newDate },
    });
    console.log(`  Fixed order #${order.orderNumber}: ${order.orderDate} -> ${newDate}`);
  }

  // Also update customer lastOrderDate fields
  console.log('\nUpdating customer lastOrderDate...');
  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    select: { id: true },
  });

  for (const customer of customers) {
    const latestOrder = await prisma.order.findFirst({
      where: { customerId: customer.id },
      orderBy: { orderDate: 'desc' },
      select: { orderDate: true },
    });

    if (latestOrder) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastOrderDate: latestOrder.orderDate },
      });
    }
  }

  // Verify fix
  const orderDates = await prisma.order.aggregate({
    where: { tenantId: tenant.id },
    _min: { orderDate: true },
    _max: { orderDate: true },
  });
  console.log('\nOrder date range after fix:');
  console.log(`  Min: ${orderDates._min.orderDate}`);
  console.log(`  Max: ${orderDates._max.orderDate}`);
}

fixOrderDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
