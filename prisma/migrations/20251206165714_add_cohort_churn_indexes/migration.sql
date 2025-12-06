-- CreateIndex
CREATE INDEX "customers_tenantId_firstOrderDate_idx" ON "customers"("tenantId", "firstOrderDate" DESC);

-- CreateIndex
CREATE INDEX "customers_tenantId_isChurnRisk_idx" ON "customers"("tenantId", "isChurnRisk");
