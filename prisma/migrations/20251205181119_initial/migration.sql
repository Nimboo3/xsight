-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CHURNED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "RFMSegment" AS ENUM ('CHAMPIONS', 'LOYAL', 'POTENTIAL_LOYALIST', 'NEW_CUSTOMERS', 'PROMISING', 'NEED_ATTENTION', 'ABOUT_TO_SLEEP', 'AT_RISK', 'CANNOT_LOSE', 'HIBERNATING', 'LOST');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PARTIALLY_PAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('FULFILLED', 'PARTIAL', 'RESTOCKED', 'PENDING');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CART_ABANDONED', 'CHECKOUT_STARTED', 'CHECKOUT_COMPLETED', 'CHECKOUT_ABANDONED', 'PRODUCT_VIEWED', 'PRODUCT_ADDED_TO_CART');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('WEBHOOK', 'API', 'BATCH_IMPORT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('CUSTOMERS', 'ORDERS', 'PRODUCTS', 'CART_ABANDONMENTS', 'CHECKOUTS');

-- CreateEnum
CREATE TYPE "SyncMode" AS ENUM ('FULL', 'INCREMENTAL', 'BACKFILL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "shopName" TEXT,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "scope" TEXT[],
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "monthlyApiCalls" INTEGER NOT NULL DEFAULT 0,
    "apiCallLimit" INTEGER NOT NULL DEFAULT 10000,
    "onboardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "avgOrderValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "firstOrderDate" TIMESTAMP(3),
    "daysSinceLastOrder" INTEGER,
    "recencyScore" SMALLINT,
    "frequencyScore" SMALLINT,
    "monetaryScore" SMALLINT,
    "rfmSegment" "RFMSegment",
    "rfmComputedAt" TIMESTAMP(3),
    "isHighValue" BOOLEAN NOT NULL DEFAULT false,
    "isChurnRisk" BOOLEAN NOT NULL DEFAULT false,
    "hasAbandonedCart" BOOLEAN NOT NULL DEFAULT false,
    "shopifyCreatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderNumber" INTEGER NOT NULL,
    "orderName" TEXT NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "subtotalPrice" DECIMAL(12,2) NOT NULL,
    "totalTax" DECIMAL(12,2) NOT NULL,
    "totalDiscounts" DECIMAL(12,2) NOT NULL,
    "financialStatus" "FinancialStatus" NOT NULL,
    "fulfillmentStatus" "FulfillmentStatus",
    "cancelledAt" TIMESTAMP(3),
    "lineItems" JSONB NOT NULL,
    "lineItemsCount" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "orderDate" TIMESTAMP(3) NOT NULL,
    "orderMonth" TEXT NOT NULL,
    "shopifyCreatedAt" TIMESTAMP(3) NOT NULL,
    "shopifyUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL(12,2),
    "compareAtPrice" DECIMAL(12,2),
    "variants" JSONB NOT NULL,
    "variantCount" INTEGER NOT NULL DEFAULT 1,
    "images" JSONB NOT NULL,
    "featuredImage" TEXT,
    "shopifyCreatedAt" TIMESTAMP(3) NOT NULL,
    "shopifyUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "eventType" "EventType" NOT NULL,
    "eventSource" "EventSource" NOT NULL DEFAULT 'WEBHOOK',
    "payload" JSONB NOT NULL,
    "value" DECIMAL(12,2),
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastComputedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_members" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalSpentSnapshot" DECIMAL(12,2) NOT NULL,
    "rfmSegmentSnapshot" "RFMSegment",
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "hmacValid" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "syncMode" "SyncMode" NOT NULL DEFAULT 'INCREMENTAL',
    "status" "JobStatus" NOT NULL,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "totalRecords" INTEGER,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_shopifyDomain_key" ON "tenants"("shopifyDomain");

-- CreateIndex
CREATE INDEX "tenants_shopifyDomain_idx" ON "tenants"("shopifyDomain");

-- CreateIndex
CREATE INDEX "tenants_status_planTier_idx" ON "tenants"("status", "planTier");

-- CreateIndex
CREATE INDEX "customers_tenantId_email_idx" ON "customers"("tenantId", "email");

-- CreateIndex
CREATE INDEX "customers_tenantId_totalSpent_idx" ON "customers"("tenantId", "totalSpent" DESC);

-- CreateIndex
CREATE INDEX "customers_tenantId_lastOrderDate_idx" ON "customers"("tenantId", "lastOrderDate" DESC);

-- CreateIndex
CREATE INDEX "customers_tenantId_rfmSegment_idx" ON "customers"("tenantId", "rfmSegment");

-- CreateIndex
CREATE INDEX "customers_tenantId_isHighValue_idx" ON "customers"("tenantId", "isHighValue");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_shopifyId_key" ON "customers"("tenantId", "shopifyId");

-- CreateIndex
CREATE INDEX "orders_tenantId_orderDate_idx" ON "orders"("tenantId", "orderDate" DESC);

-- CreateIndex
CREATE INDEX "orders_tenantId_customerId_idx" ON "orders"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "orders_tenantId_orderMonth_idx" ON "orders"("tenantId", "orderMonth");

-- CreateIndex
CREATE INDEX "orders_tenantId_financialStatus_idx" ON "orders"("tenantId", "financialStatus");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenantId_shopifyId_key" ON "orders"("tenantId", "shopifyId");

-- CreateIndex
CREATE INDEX "products_tenantId_status_idx" ON "products"("tenantId", "status");

-- CreateIndex
CREATE INDEX "products_tenantId_productType_idx" ON "products"("tenantId", "productType");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_shopifyId_key" ON "products"("tenantId", "shopifyId");

-- CreateIndex
CREATE INDEX "events_tenantId_eventType_occurredAt_idx" ON "events"("tenantId", "eventType", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "events_tenantId_customerId_idx" ON "events"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "segments_tenantId_isActive_idx" ON "segments"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "segment_members_segmentId_idx" ON "segment_members"("segmentId");

-- CreateIndex
CREATE INDEX "segment_members_customerId_idx" ON "segment_members"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "segment_members_segmentId_customerId_key" ON "segment_members"("segmentId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_topic_receivedAt_idx" ON "webhook_events"("tenantId", "topic", "receivedAt" DESC);

-- CreateIndex
CREATE INDEX "webhook_events_processed_receivedAt_idx" ON "webhook_events"("processed", "receivedAt");

-- CreateIndex
CREATE INDEX "sync_jobs_tenantId_status_createdAt_idx" ON "sync_jobs"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "sync_jobs_status_startedAt_idx" ON "sync_jobs"("status", "startedAt");

-- CreateIndex
CREATE INDEX "sessions_shop_idx" ON "sessions"("shop");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segments" ADD CONSTRAINT "segments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_members" ADD CONSTRAINT "segment_members_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_members" ADD CONSTRAINT "segment_members_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
