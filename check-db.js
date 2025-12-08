const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE CHECK ===\n');
  
  // Check tenants - full data
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants (full data):');
  console.log(JSON.stringify(tenants, null, 2));
  
  // Check users
  const users = await prisma.user.findMany();
  console.log('\nUsers:', users.length);
  users.forEach(u => {
    console.log(`  - ${u.id}: ${u.email}`);
  });
  
  // Check orders
  const orders = await prisma.order.count();
  console.log('\nTotal Orders:', orders);
  
  // Sample order to see structure
  const sampleOrder = await prisma.order.findFirst();
  if (sampleOrder) {
    console.log('Sample Order tenantId:', sampleOrder.tenantId);
  }
  
  // Check customers
  const customers = await prisma.customer.count();
  console.log('Total Customers:', customers);
  
  // Sample customer to see structure
  const sampleCustomer = await prisma.customer.findFirst();
  if (sampleCustomer) {
    console.log('Sample Customer tenantId:', sampleCustomer.tenantId);
  }
  
  // Check sessions
  const sessions = await prisma.session.findMany();
  console.log('\nSessions:', sessions.length);
  console.log(JSON.stringify(sessions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
