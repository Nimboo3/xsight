const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete the broken tenant for mytestdukaan-2
  // This will allow a fresh OAuth to create a new one
  const result = await prisma.tenant.delete({
    where: { shopifyDomain: 'mytestdukaan-2.myshopify.com' }
  });
  console.log('Deleted tenant:', result.id);
  
  // Also delete the session
  await prisma.session.deleteMany({
    where: { shop: 'mytestdukaan-2.myshopify.com' }
  });
  console.log('Deleted sessions for mytestdukaan-2');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
