/**
 * Churn Prediction Service
 * 
 * Implements decay-based churn probability calculation for customers.
 * Uses exponential decay formula considering:
 * - Days since last order (recency)
 * - Average purchase frequency
 * - Total customer value
 * - RFM scores
 * 
 * Formula: P(churn) = 1 - e^(-λ * t)
 * Where:
 *   λ = decay rate (based on purchase frequency)
 *   t = time since last expected purchase (days overdue)
 * 
 * This provides a probability score (0-1) rather than a binary flag.
 */

import { RFMSegment, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../lib/logger';

const log = logger.child({ module: 'churn-prediction' });

// Churn risk thresholds
export const CHURN_THRESHOLDS = {
  LOW: 0.3,      // < 30% probability = low risk
  MEDIUM: 0.6,   // 30-60% = medium risk
  HIGH: 0.8,     // 60-80% = high risk
  CRITICAL: 0.9, // > 80% = critical (about to churn)
};

// Base decay rates by segment (λ values)
// Higher value = faster decay (quicker to churn)
export const SEGMENT_DECAY_RATES: Record<RFMSegment, number> = {
  CHAMPIONS: 0.005,       // Very slow decay - loyal customers
  LOYAL: 0.008,           // Slow decay
  POTENTIAL_LOYALIST: 0.012,
  NEW_CUSTOMERS: 0.020,   // Faster decay - need nurturing
  PROMISING: 0.015,
  NEED_ATTENTION: 0.025,  // Elevated risk
  ABOUT_TO_SLEEP: 0.035,  // High decay
  AT_RISK: 0.040,         // Very high decay
  CANNOT_LOSE: 0.030,     // High value but risky
  HIBERNATING: 0.045,     // Near churn
  LOST: 0.050,            // Effectively churned
};

// Default decay rate for customers without segment
const DEFAULT_DECAY_RATE = 0.020;

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  daysSinceLastOrder: number;
  expectedPurchaseInterval: number;
  daysOverdue: number;
  factors: {
    recencyImpact: number;
    frequencyImpact: number;
    monetaryImpact: number;
    segmentImpact: number;
  };
  recommendation: string;
}

/**
 * Calculate expected purchase interval based on order history
 * Uses median time between orders, with fallback to 90 days for single-order customers
 */
async function calculateExpectedPurchaseInterval(
  tenantId: string,
  customerId: string
): Promise<number> {
  // Get customer's order dates
  const orders = await prisma.order.findMany({
    where: { tenantId, customerId, financialStatus: 'PAID' },
    select: { orderDate: true },
    orderBy: { orderDate: 'asc' },
  });

  if (orders.length <= 1) {
    // Single order customer - use tenant average or default
    const tenantAvg = await prisma.$queryRaw<[{ avg_interval: number | null }]>`
      WITH order_intervals AS (
        SELECT 
          customer_id,
          order_date,
          LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as prev_order_date
        FROM orders
        WHERE tenant_id = ${tenantId}
          AND financial_status = 'PAID'
      )
      SELECT AVG(EXTRACT(DAY FROM order_date - prev_order_date))::numeric as avg_interval
      FROM order_intervals
      WHERE prev_order_date IS NOT NULL
    `;

    return tenantAvg[0]?.avg_interval ?? 90;
  }

  // Calculate intervals between orders
  const intervals: number[] = [];
  for (let i = 1; i < orders.length; i++) {
    const daysDiff = Math.floor(
      (orders[i].orderDate.getTime() - orders[i - 1].orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    intervals.push(daysDiff);
  }

  // Use median interval (more robust than mean)
  intervals.sort((a, b) => a - b);
  const mid = Math.floor(intervals.length / 2);
  const medianInterval = intervals.length % 2 === 0
    ? (intervals[mid - 1] + intervals[mid]) / 2
    : intervals[mid];

  return Math.max(7, medianInterval); // Minimum 7 days
}

/**
 * Calculate churn probability using exponential decay
 */
export async function calculateChurnProbability(
  tenantId: string,
  customerId: string
): Promise<ChurnPrediction | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    select: {
      id: true,
      totalSpent: true,
      ordersCount: true,
      avgOrderValue: true,
      lastOrderDate: true,
      firstOrderDate: true,
      daysSinceLastOrder: true,
      recencyScore: true,
      frequencyScore: true,
      monetaryScore: true,
      rfmSegment: true,
      isHighValue: true,
    },
  });

  if (!customer || !customer.lastOrderDate) {
    return null;
  }

  const daysSinceLastOrder = customer.daysSinceLastOrder ??
    Math.floor((Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate expected purchase interval
  const expectedInterval = await calculateExpectedPurchaseInterval(tenantId, customerId);
  
  // Days overdue = how many days past expected next purchase
  const daysOverdue = Math.max(0, daysSinceLastOrder - expectedInterval);

  // Get base decay rate from segment
  const baseDecayRate = customer.rfmSegment
    ? SEGMENT_DECAY_RATES[customer.rfmSegment]
    : DEFAULT_DECAY_RATE;

  // Adjust decay rate based on RFM scores (if available)
  let adjustedDecayRate = baseDecayRate;
  
  if (customer.recencyScore && customer.frequencyScore && customer.monetaryScore) {
    // Lower scores = higher churn risk = faster decay
    const avgScore = (customer.recencyScore + customer.frequencyScore + customer.monetaryScore) / 3;
    // Scale factor: score of 1 = 1.5x decay, score of 5 = 0.5x decay
    const scoreFactor = 1.75 - (avgScore * 0.25);
    adjustedDecayRate *= scoreFactor;
  }

  // High-value customers get slower decay (more forgiving)
  if (customer.isHighValue) {
    adjustedDecayRate *= 0.7;
  }

  // Apply exponential decay formula: P = 1 - e^(-λ * t)
  // Using daysOverdue as t (only count days past expected interval)
  const churnProbability = 1 - Math.exp(-adjustedDecayRate * daysOverdue);
  
  // Clamp to 0-1 range
  const clampedProbability = Math.min(1, Math.max(0, churnProbability));

  // Determine risk level
  let riskLevel: ChurnPrediction['riskLevel'];
  if (clampedProbability < CHURN_THRESHOLDS.LOW) {
    riskLevel = 'LOW';
  } else if (clampedProbability < CHURN_THRESHOLDS.MEDIUM) {
    riskLevel = 'MEDIUM';
  } else if (clampedProbability < CHURN_THRESHOLDS.HIGH) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'CRITICAL';
  }

  // Calculate individual factor impacts (for explainability)
  const factors = {
    recencyImpact: Math.min(1, daysOverdue / 180), // Max at 180 days overdue
    frequencyImpact: customer.frequencyScore ? 1 - (customer.frequencyScore / 5) : 0.5,
    monetaryImpact: customer.monetaryScore ? 1 - (customer.monetaryScore / 5) : 0.5,
    segmentImpact: baseDecayRate / DEFAULT_DECAY_RATE,
  };

  // Generate recommendation
  const recommendation = generateRecommendation(riskLevel, customer.rfmSegment, customer.isHighValue);

  return {
    customerId,
    churnProbability: Math.round(clampedProbability * 1000) / 1000, // 3 decimal places
    riskLevel,
    daysSinceLastOrder,
    expectedPurchaseInterval: Math.round(expectedInterval),
    daysOverdue,
    factors,
    recommendation,
  };
}

/**
 * Generate actionable recommendation based on churn risk
 */
function generateRecommendation(
  riskLevel: ChurnPrediction['riskLevel'],
  segment: RFMSegment | null,
  isHighValue: boolean
): string {
  if (riskLevel === 'LOW') {
    return 'Customer is engaged. Continue current strategy.';
  }

  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    if (isHighValue) {
      return 'HIGH PRIORITY: Valuable customer at risk. Consider personal outreach, exclusive offer, or VIP discount.';
    }
    if (segment === 'CANNOT_LOSE') {
      return 'URGENT: Win-back campaign needed. Offer significant incentive to prevent churn.';
    }
    return 'Re-engagement needed. Send win-back email series with incentive.';
  }

  // MEDIUM risk
  if (segment === 'NEED_ATTENTION' || segment === 'ABOUT_TO_SLEEP') {
    return 'Proactive engagement recommended. Send personalized product recommendations.';
  }
  
  return 'Monitor closely. Consider sending reminder or promotional email.';
}

/**
 * Batch calculate churn probability for all customers in tenant
 */
export async function calculateChurnForTenant(
  tenantId: string,
  onProgress?: (processed: number, total: number) => Promise<void>
): Promise<{
  tenantId: string;
  totalProcessed: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  duration: number;
}> {
  const startTime = Date.now();
  log.info({ tenantId }, 'Starting tenant-wide churn calculation');

  // Get all customers with orders
  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      lastOrderDate: { not: null },
      ordersCount: { gt: 0 },
    },
    select: { id: true },
  });

  const total = customers.length;
  let processed = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    
    const predictions = await Promise.all(
      batch.map((c) => calculateChurnProbability(tenantId, c.id))
    );

    // Update customers with churn probability
    const updates = predictions
      .filter((p): p is ChurnPrediction => p !== null)
      .map((p) => 
        prisma.customer.update({
          where: { id: p.customerId },
          data: {
            isChurnRisk: p.churnProbability >= CHURN_THRESHOLDS.MEDIUM,
          },
        })
      );

    await prisma.$transaction(updates);

    // Count risk levels
    for (const p of predictions) {
      if (!p) continue;
      switch (p.riskLevel) {
        case 'CRITICAL': criticalCount++; break;
        case 'HIGH': highCount++; break;
        case 'MEDIUM': mediumCount++; break;
        case 'LOW': lowCount++; break;
      }
    }

    processed += batch.length;
    
    if (onProgress) {
      await onProgress(processed, total);
    }
  }

  const duration = Date.now() - startTime;
  log.info({
    tenantId,
    total,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    duration,
  }, 'Tenant churn calculation complete');

  return {
    tenantId,
    totalProcessed: processed,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    duration,
  };
}

/**
 * Get customers at churn risk sorted by probability
 */
export async function getChurnRiskCustomers(
  tenantId: string,
  options: {
    minProbability?: number;
    limit?: number;
    includeHighValueOnly?: boolean;
  } = {}
): Promise<Array<{
  customer: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    totalSpent: number;
    ordersCount: number;
    lastOrderDate: Date | null;
    rfmSegment: RFMSegment | null;
    isHighValue: boolean;
  };
  prediction: ChurnPrediction;
}>> {
  const { minProbability = 0.3, limit = 50, includeHighValueOnly = false } = options;

  const where: Prisma.CustomerWhereInput = {
    tenantId,
    lastOrderDate: { not: null },
    ordersCount: { gt: 0 },
    isChurnRisk: true,
  };

  if (includeHighValueOnly) {
    where.isHighValue = true;
  }

  const customers = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      totalSpent: true,
      ordersCount: true,
      lastOrderDate: true,
      rfmSegment: true,
      isHighValue: true,
    },
    orderBy: { totalSpent: 'desc' }, // Prioritize high-value customers
    take: limit * 2, // Fetch more to filter by probability
  });

  // Calculate predictions and filter
  const results: Array<{
    customer: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      totalSpent: number;
      ordersCount: number;
      lastOrderDate: Date | null;
      rfmSegment: RFMSegment | null;
      isHighValue: boolean;
    };
    prediction: ChurnPrediction;
  }> = [];

  for (const customer of customers) {
    const prediction = await calculateChurnProbability(tenantId, customer.id);
    
    if (prediction && prediction.churnProbability >= minProbability) {
      results.push({
        customer: {
          ...customer,
          totalSpent: Number(customer.totalSpent),
        },
        prediction,
      });
    }

    if (results.length >= limit) break;
  }

  // Sort by churn probability descending
  results.sort((a, b) => b.prediction.churnProbability - a.prediction.churnProbability);

  return results.slice(0, limit);
}
