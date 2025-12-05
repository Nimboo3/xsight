import { PrismaClient, RFMSegment, FinancialStatus, FulfillmentStatus, PlanTier } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to create hash (simulating encryption for seed)
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo tenant
  const demoToken = 'shpat_demo_token_12345';
  const tenant = await prisma.tenant.upsert({
    where: { shopifyDomain: 'demo-store.myshopify.com' },
    update: {},
    create: {
      shopifyDomain: 'demo-store.myshopify.com',
      shopName: 'Demo Store',
      email: 'demo@example.com',
      accessToken: demoToken, // In production, this would be encrypted
      accessTokenHash: hashToken(demoToken),
      scope: ['read_customers', 'write_customers', 'read_orders', 'read_products'],
      planTier: PlanTier.STARTER,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Created tenant: ${tenant.shopifyDomain}`);

  // Create demo customers
  const customers = [
    {
      shopifyId: 'gid://shopify/Customer/1001',
      email: 'vip@example.com',
      firstName: 'Victoria',
      lastName: 'Premium',
      totalSpent: 5000,
      ordersCount: 25,
      avgOrderValue: 200,
      recencyScore: 5,
      frequencyScore: 5,
      monetaryScore: 5,
      rfmSegment: RFMSegment.CHAMPIONS,
      isHighValue: true,
      shopifyCreatedAt: new Date('2023-01-15'),
    },
    {
      shopifyId: 'gid://shopify/Customer/1002',
      email: 'loyal@example.com',
      firstName: 'Lucas',
      lastName: 'Loyal',
      totalSpent: 2500,
      ordersCount: 15,
      avgOrderValue: 166.67,
      recencyScore: 4,
      frequencyScore: 4,
      monetaryScore: 5,
      rfmSegment: RFMSegment.LOYAL,
      isHighValue: true,
      shopifyCreatedAt: new Date('2023-03-20'),
    },
    {
      shopifyId: 'gid://shopify/Customer/1003',
      email: 'potential@example.com',
      firstName: 'Patrick',
      lastName: 'Potential',
      totalSpent: 800,
      ordersCount: 5,
      avgOrderValue: 160,
      recencyScore: 4,
      frequencyScore: 3,
      monetaryScore: 3,
      rfmSegment: RFMSegment.POTENTIAL_LOYALIST,
      isHighValue: false,
      shopifyCreatedAt: new Date('2023-06-10'),
    },
    {
      shopifyId: 'gid://shopify/Customer/1004',
      email: 'new@example.com',
      firstName: 'Nancy',
      lastName: 'Newcomer',
      totalSpent: 150,
      ordersCount: 1,
      avgOrderValue: 150,
      recencyScore: 5,
      frequencyScore: 1,
      monetaryScore: 1,
      rfmSegment: RFMSegment.NEW_CUSTOMERS,
      isHighValue: false,
      shopifyCreatedAt: new Date('2024-11-01'),
    },
    {
      shopifyId: 'gid://shopify/Customer/1005',
      email: 'atrisk@example.com',
      firstName: 'Robert',
      lastName: 'Risk',
      totalSpent: 1500,
      ordersCount: 10,
      avgOrderValue: 150,
      recencyScore: 2,
      frequencyScore: 4,
      monetaryScore: 4,
      rfmSegment: RFMSegment.AT_RISK,
      isChurnRisk: true,
      shopifyCreatedAt: new Date('2023-02-15'),
    },
  ];

  for (const customerData of customers) {
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_shopifyId: {
          tenantId: tenant.id,
          shopifyId: customerData.shopifyId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...customerData,
      },
    });
    console.log(`✅ Created customer: ${customer.email}`);
  }

  // Create demo segments
  const segments = [
    {
      name: 'VIP Customers',
      description: 'High-value customers with RFM segment CHAMPIONS or LOYAL',
      filters: {
        operator: 'OR',
        conditions: [
          { field: 'rfmSegment', operator: 'eq', value: 'CHAMPIONS' },
          { field: 'rfmSegment', operator: 'eq', value: 'LOYAL' },
        ],
      },
      isActive: true,
    },
    {
      name: 'At Risk',
      description: 'Previously active customers who haven\'t purchased recently',
      filters: {
        operator: 'OR',
        conditions: [
          { field: 'rfmSegment', operator: 'eq', value: 'AT_RISK' },
          { field: 'rfmSegment', operator: 'eq', value: 'ABOUT_TO_SLEEP' },
        ],
      },
      isActive: true,
    },
    {
      name: 'New Customers',
      description: 'Customers with only 1 order',
      filters: {
        operator: 'AND',
        conditions: [
          { field: 'ordersCount', operator: 'lte', value: 1 },
        ],
      },
      isActive: true,
    },
  ];

  for (const segmentData of segments) {
    const segment = await prisma.segment.upsert({
      where: {
        id: `seed-${segmentData.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: segmentData,
      create: {
        id: `seed-${segmentData.name.toLowerCase().replace(/\s+/g, '-')}`,
        tenantId: tenant.id,
        ...segmentData,
      },
    });
    console.log(`✅ Created segment: ${segment.name}`);
  }

  // Create demo orders for VIP customer
  const vipCustomer = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, email: 'vip@example.com' },
  });

  if (vipCustomer) {
    const orders = [
      {
        shopifyId: 'gid://shopify/Order/5001',
        orderNumber: 1001,
        orderName: '#1001',
        totalPrice: 250.00,
        subtotalPrice: 230.00,
        totalTax: 20.00,
        totalDiscounts: 0,
        currency: 'USD',
        financialStatus: FinancialStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
        lineItems: [{ product_id: 'p1', title: 'Premium Widget', quantity: 2, price: 115 }],
        lineItemsCount: 1,
        orderDate: new Date('2024-01-15'),
        orderMonth: '2024-01',
        shopifyCreatedAt: new Date('2024-01-15'),
        shopifyUpdatedAt: new Date('2024-01-16'),
      },
      {
        shopifyId: 'gid://shopify/Order/5002',
        orderNumber: 1002,
        orderName: '#1002',
        totalPrice: 180.00,
        subtotalPrice: 165.00,
        totalTax: 15.00,
        totalDiscounts: 0,
        currency: 'USD',
        financialStatus: FinancialStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
        lineItems: [{ product_id: 'p2', title: 'Standard Widget', quantity: 3, price: 55 }],
        lineItemsCount: 1,
        orderDate: new Date('2024-02-20'),
        orderMonth: '2024-02',
        shopifyCreatedAt: new Date('2024-02-20'),
        shopifyUpdatedAt: new Date('2024-02-21'),
      },
      {
        shopifyId: 'gid://shopify/Order/5003',
        orderNumber: 1003,
        orderName: '#1003',
        totalPrice: 320.00,
        subtotalPrice: 295.00,
        totalTax: 25.00,
        totalDiscounts: 0,
        currency: 'USD',
        financialStatus: FinancialStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.PARTIAL,
        lineItems: [
          { product_id: 'p1', title: 'Premium Widget', quantity: 1, price: 115 },
          { product_id: 'p3', title: 'Deluxe Widget', quantity: 1, price: 180 },
        ],
        lineItemsCount: 2,
        orderDate: new Date('2024-03-10'),
        orderMonth: '2024-03',
        shopifyCreatedAt: new Date('2024-03-10'),
        shopifyUpdatedAt: new Date('2024-03-11'),
      },
    ];

    for (const orderData of orders) {
      const order = await prisma.order.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: tenant.id,
            shopifyId: orderData.shopifyId,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          customerId: vipCustomer.id,
          ...orderData,
        },
      });
      console.log(`✅ Created order: ${order.orderName}`);
    }
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
