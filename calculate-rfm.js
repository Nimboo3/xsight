/**
 * Trigger RFM recalculation for all customers
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// RFM Segment determination logic (matching rfm.service.ts)
function determineRfmSegment(r, f, m) {
  // Champions: Best customers - high on all dimensions
  if (r >= 4 && f >= 4 && m >= 4) {
    return 'CHAMPIONS';
  }

  // Loyal: Consistent high value customers
  if (r >= 3 && f >= 3 && m >= 4) {
    return 'LOYAL';
  }

  // Cannot Lose: Were valuable but haven't purchased recently
  if (r <= 2 && f >= 3 && m >= 4) {
    return 'CANNOT_LOSE';
  }

  // At Risk: Were good customers, now declining
  if (r <= 2 && f >= 2 && m >= 3) {
    return 'AT_RISK';
  }

  // Lost: Lowest scores across all dimensions
  if (r === 1 && f === 1 && m === 1) {
    return 'LOST';
  }

  // New Customers: Just arrived, one purchase
  if (r >= 4 && f === 1 && m <= 2) {
    return 'NEW_CUSTOMERS';
  }

  // Promising: Recent buyers with potential
  if (r >= 4 && f <= 2 && m <= 2) {
    return 'PROMISING';
  }

  // Potential Loyalists: Recent, moderate frequency
  if (r >= 3 && f >= 2 && f <= 3 && m >= 2) {
    return 'POTENTIAL_LOYALIST';
  }

  // Need Attention: Above average but need engagement
  if (r >= 2 && r <= 3 && f >= 2 && f <= 3 && m >= 2 && m <= 3) {
    return 'NEED_ATTENTION';
  }

  // About to Sleep: Below average, declining
  if (r >= 2 && r <= 3 && f <= 2 && m <= 2) {
    return 'ABOUT_TO_SLEEP';
  }

  // Hibernating: Low on all dimensions but not completely lost
  if (r <= 2 && f <= 2 && m <= 2 && (r > 1 || f > 1 || m > 1)) {
    return 'HIBERNATING';
  }

  // Default fallback
  return 'NEED_ATTENTION';
}

async function calculateRfmScores(tenantId) {
  console.log('Calculating RFM scores for tenant:', tenantId);

  // Get all customers with orders
  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      ordersCount: { gt: 0 },
      lastOrderDate: { not: null },
    },
    select: {
      id: true,
      ordersCount: true,
      totalSpent: true,
      lastOrderDate: true,
    },
  });

  console.log(`Found ${customers.length} customers with orders`);

  if (customers.length === 0) {
    console.log('No customers to process');
    return;
  }

  // Calculate metrics for all customers
  const metrics = customers.map(c => {
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: c.id,
      daysSinceLastOrder,
      ordersCount: c.ordersCount,
      totalSpent: Number(c.totalSpent),
    };
  });

  // Sort to determine quintiles
  const sortedByRecency = [...metrics].sort((a, b) => a.daysSinceLastOrder - b.daysSinceLastOrder);
  const sortedByFrequency = [...metrics].sort((a, b) => a.ordersCount - b.ordersCount);
  const sortedByMonetary = [...metrics].sort((a, b) => a.totalSpent - b.totalSpent);

  // Assign scores using NTILE (1-5)
  const n = metrics.length;
  const getScore = (sortedList, id, invert = false) => {
    const idx = sortedList.findIndex(m => m.id === id);
    const score = Math.ceil((idx + 1) / n * 5);
    return invert ? 6 - score : score;
  };

  // Calculate P90 for high value threshold
  const sortedSpent = metrics.map(m => m.totalSpent).sort((a, b) => a - b);
  const p90Index = Math.floor(n * 0.9);
  const highValueThreshold = sortedSpent[p90Index] || 0;

  console.log('High value threshold (P90):', highValueThreshold);

  // Update each customer
  let updated = 0;
  for (const m of metrics) {
    const recencyScore = getScore(sortedByRecency, m.id, true); // Lower days = higher score
    const frequencyScore = getScore(sortedByFrequency, m.id);
    const monetaryScore = getScore(sortedByMonetary, m.id);
    const segment = determineRfmSegment(recencyScore, frequencyScore, monetaryScore);

    await prisma.customer.update({
      where: { id: m.id },
      data: {
        daysSinceLastOrder: m.daysSinceLastOrder,
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmSegment: segment,
        rfmComputedAt: new Date(),
        isHighValue: m.totalSpent >= highValueThreshold,
        isChurnRisk: m.daysSinceLastOrder >= 90,
      },
    });
    updated++;
  }

  console.log(`Updated ${updated} customers with RFM scores`);

  // Show segment distribution
  const segmentCounts = await prisma.customer.groupBy({
    by: ['rfmSegment'],
    where: { tenantId },
    _count: { id: true },
  });
  console.log('\nSegment distribution after calculation:');
  segmentCounts.forEach(s => {
    console.log(`  - ${s.rfmSegment || 'No Segment'}: ${s._count.id} customers`);
  });
}

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }
  await calculateRfmScores(tenant.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
