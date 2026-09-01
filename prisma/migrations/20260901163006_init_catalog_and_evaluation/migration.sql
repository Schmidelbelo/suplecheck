-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "certifications" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "manufacturerId" TEXT,
    "attributes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GALLERY',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "gtin" TEXT,
    "variantLabel" TEXT NOT NULL,
    "servingsPerUnit" INTEGER,
    "dosagePerServing" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "successorSkuId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "skus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "skus_successorSkuId_fkey" FOREIGN KEY ("successorSkuId") REFERENCES "skus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "affiliateBaseUrl" TEXT,
    "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "price_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skuId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "url" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "importBatchId" TEXT,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_entries_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "price_entries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "price_entries_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'SIMPLE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "applicableCategories" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "methodologies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "methodologies_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "methodology_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodologyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "aggregationStrategy" TEXT NOT NULL DEFAULT 'weighted-average',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "publishedByAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "methodology_versions_methodologyId_fkey" FOREIGN KEY ("methodologyId") REFERENCES "methodologies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "methodology_versions_publishedByAdminId_fkey" FOREIGN KEY ("publishedByAdminId") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "methodology_version_criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodologyVersionId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "methodology_version_criteria_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "methodology_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "methodology_version_criteria_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "methodology_classification_bands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodologyVersionId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "minScore" REAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "methodology_classification_bands_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "methodology_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "methodology_category_overrides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodologyVersionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "disabledCriterionIds" JSONB,
    "weightOverrides" JSONB,
    CONSTRAINT "methodology_category_overrides_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "methodology_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "methodology_category_overrides_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "category_active_methodologies" (
    "categoryId" TEXT NOT NULL PRIMARY KEY,
    "methodologyVersionId" TEXT NOT NULL,
    "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_active_methodologies_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "category_active_methodologies_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "methodology_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "methodologyVersionId" TEXT NOT NULL,
    "finalScore" REAL NOT NULL,
    "classificationTier" TEXT NOT NULL,
    "classificationLabel" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "importBatchId" TEXT,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_scores_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_scores_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "product_scores_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "methodology_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "product_scores_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_score_criterion_breakdowns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productScoreId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "notes" JSONB,
    "flags" JSONB,
    CONSTRAINT "product_score_criterion_breakdowns_productScoreId_fkey" FOREIGN KEY ("productScoreId") REFERENCES "product_scores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_score_criterion_breakdowns_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "methodologyVersionId" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rankings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rankings_methodologyVersionId_fkey" FOREIGN KEY ("methodologyVersionId") REFERENCES "methodology_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ranking_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rankingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "finalScore" REAL NOT NULL,
    "classificationTier" TEXT NOT NULL,
    CONSTRAINT "ranking_entries_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "rankings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ranking_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "authorAdminId" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "articles_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'landing_page',
    "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "emailVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CURATOR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "targetValue" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "triggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "triggeredByAdminId" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "importedRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "revertedAt" DATETIME,
    CONSTRAINT "import_batches_triggeredByAdminId_fkey" FOREIGN KEY ("triggeredByAdminId") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_record_errors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "stage" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "errorMessage" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "suggestedMatches" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "import_record_errors_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorType" TEXT NOT NULL,
    "actorAdminId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_active_idx" ON "categories"("active");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_slug_key" ON "manufacturers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_status_idx" ON "products"("categoryId", "status");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_manufacturerId_idx" ON "products"("manufacturerId");

-- CreateIndex
CREATE INDEX "product_images_productId_position_idx" ON "product_images"("productId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "skus_gtin_key" ON "skus"("gtin");

-- CreateIndex
CREATE UNIQUE INDEX "skus_successorSkuId_key" ON "skus"("successorSkuId");

-- CreateIndex
CREATE INDEX "skus_productId_status_idx" ON "skus"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "price_entries_skuId_storeId_capturedAt_idx" ON "price_entries"("skuId", "storeId", "capturedAt");

-- CreateIndex
CREATE INDEX "price_entries_storeId_capturedAt_idx" ON "price_entries"("storeId", "capturedAt");

-- CreateIndex
CREATE INDEX "criteria_status_idx" ON "criteria"("status");

-- CreateIndex
CREATE INDEX "methodologies_categoryId_idx" ON "methodologies"("categoryId");

-- CreateIndex
CREATE INDEX "methodology_versions_status_idx" ON "methodology_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_versions_methodologyId_version_key" ON "methodology_versions"("methodologyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_version_criteria_methodologyVersionId_criterionId_key" ON "methodology_version_criteria"("methodologyVersionId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_classification_bands_methodologyVersionId_tier_key" ON "methodology_classification_bands"("methodologyVersionId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_category_overrides_methodologyVersionId_categoryId_key" ON "methodology_category_overrides"("methodologyVersionId", "categoryId");

-- CreateIndex
CREATE INDEX "product_scores_productId_calculatedAt_idx" ON "product_scores"("productId", "calculatedAt");

-- CreateIndex
CREATE INDEX "product_scores_categoryId_calculatedAt_idx" ON "product_scores"("categoryId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_score_criterion_breakdowns_productScoreId_criterionId_key" ON "product_score_criterion_breakdowns"("productScoreId", "criterionId");

-- CreateIndex
CREATE INDEX "rankings_categoryId_generatedAt_idx" ON "rankings"("categoryId", "generatedAt");

-- CreateIndex
CREATE INDEX "ranking_entries_rankingId_position_idx" ON "ranking_entries"("rankingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_entries_rankingId_productId_key" ON "ranking_entries"("rankingId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_publishedAt_idx" ON "articles"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "favorites_productId_idx" ON "favorites"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_productId_key" ON "favorites"("userId", "productId");

-- CreateIndex
CREATE INDEX "alerts_userId_status_idx" ON "alerts"("userId", "status");

-- CreateIndex
CREATE INDEX "alerts_productId_status_idx" ON "alerts"("productId", "status");

-- CreateIndex
CREATE INDEX "import_batches_status_idx" ON "import_batches"("status");

-- CreateIndex
CREATE INDEX "import_batches_source_startedAt_idx" ON "import_batches"("source", "startedAt");

-- CreateIndex
CREATE INDEX "import_record_errors_importBatchId_stage_idx" ON "import_record_errors"("importBatchId", "stage");

-- CreateIndex
CREATE INDEX "import_record_errors_severity_idx" ON "import_record_errors"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorAdminId_idx" ON "audit_logs"("actorAdminId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
