const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get the current session for mytestdukaan-2
  const sessions = await prisma.session.findMany({
    where: { shop: 'mytestdukaan-2.myshopify.com' }
  });
  
  console.log('Sessions found:', sessions.length);
  
  if (sessions.length > 0) {
    const session = sessions[0];
    console.log('Session accessToken:', session.accessToken ? 'EXISTS' : 'EMPTY');
    console.log('Session scope:', session.scope);
    
    // Update tenant with session data
    if (session.accessToken) {
      const updated = await prisma.tenant.update({
        where: { shopifyDomain: 'mytestdukaan-2.myshopify.com' },
        data: {
          accessToken: session.accessToken,
          status: 'ACTIVE',
          scope: session.scope ? session.scope.split(',') : []
        }
      });
      console.log('Tenant updated:', updated.id);
      console.log('New status:', updated.status);
    }
  } else {
    console.log('No session found. Check OAuth flow.');
    
    // Show current tenant state
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain: 'mytestdukaan-2.myshopify.com' }
    });
    console.log('Current tenant:', JSON.stringify(tenant, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
