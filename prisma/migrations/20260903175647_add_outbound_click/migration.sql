-- CreateTable
CREATE TABLE "outbound_clicks" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "position" INTEGER,
    "wasAffiliate" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbound_clicks_productId_createdAt_idx" ON "outbound_clicks"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "outbound_clicks_storeId_createdAt_idx" ON "outbound_clicks"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "outbound_clicks_categoryId_createdAt_idx" ON "outbound_clicks"("categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
