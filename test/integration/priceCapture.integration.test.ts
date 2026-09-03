import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { runPriceCaptureJob } from "../../src/modules/pricing/pipeline/PriceCaptureJobRunner";
import { uniqueSuffix } from "../setupTestContainer";

/**
 * Integration Test do pipeline de captura de preço — ponta a ponta
 * contra o PostgreSQL (Neon) real, com dados de teste isolados
 * (prefixo único) para nunca tocar o catálogo real de produção durante
 * a suíte. Usa a implementação padrão do scraper
 * (`LastKnownPriceScraperProvider`), que não faz nenhuma requisição
 * externa — confirma o comportamento real do pipeline (validação,
 * normalização, comparação, persistência, atualização do produto,
 * registro em `ImportBatch`), não o scraping em si (fora de escopo).
 */
const client = new PrismaClient();
const suffix = uniqueSuffix();

const createdIds = {
  categoryId: "",
  brandId: "",
  productId: "",
  skuId: "",
  storeId: "",
  importBatchId: "",
};

afterAll(async () => {
  if (createdIds.importBatchId) {
    await client.importRecordError.deleteMany({
      where: { importBatchId: createdIds.importBatchId },
    });
  }
  await client.priceEntry.deleteMany({ where: { skuId: createdIds.skuId } });
  if (createdIds.importBatchId) {
    await client.importBatch.deleteMany({ where: { id: createdIds.importBatchId } });
  }
  await client.sku.deleteMany({ where: { id: createdIds.skuId } });
  await client.product.deleteMany({ where: { id: createdIds.productId } });
  await client.brand.deleteMany({ where: { id: createdIds.brandId } });
  await client.category.deleteMany({ where: { id: createdIds.categoryId } });
  await client.$disconnect();
});

describe("Pipeline de captura de preço — integração ponta a ponta", () => {
  it("captura, persiste histórico e registra o job em ImportBatch", async () => {
    const category = await client.category.create({
      data: { slug: `pc-cat-${suffix}`, name: `Categoria Price Capture ${suffix}` },
    });
    createdIds.categoryId = category.id;

    const brand = await client.brand.create({
      data: { slug: `pc-brand-${suffix}`, name: `Marca Price Capture ${suffix}` },
    });
    createdIds.brandId = brand.id;

    const store = await client.store.findFirst();
    if (!store) throw new Error("Nenhuma Store no banco de teste — seed precisa ter rodado.");
    createdIds.storeId = store.id;

    const product = await client.product.create({
      data: {
        slug: `pc-product-${suffix}`,
        name: `Produto Price Capture ${suffix}`,
        categoryId: category.id,
        brandId: brand.id,
        status: "PUBLISHED",
      },
    });
    createdIds.productId = product.id;

    const sku = await client.sku.create({
      data: { productId: product.id, variantLabel: "300g", status: "ACTIVE" },
    });
    createdIds.skuId = sku.id;

    await client.priceEntry.create({
      data: { skuId: sku.id, storeId: store.id, priceCents: 5000, availability: "IN_STOCK" },
    });

    const productBeforeCapture = await client.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    const summary = await runPriceCaptureJob(undefined, { skuIds: [sku.id] });
    createdIds.importBatchId = summary.importBatchId;

    expect(summary.totalProducts).toBe(1);
    expect(summary.failed).toBe(0);
    expect(summary.unchanged).toBe(1); // LastKnownPriceScraperProvider confirma o mesmo preço

    const history = await client.priceEntry.findMany({
      where: { skuId: sku.id },
      orderBy: { capturedAt: "asc" },
    });
    expect(history).toHaveLength(2);
    expect(history[1]!.priceCents).toBe(5000);
    expect(history[1]!.importBatchId).toBe(summary.importBatchId);

    const batch = await client.importBatch.findUniqueOrThrow({
      where: { id: summary.importBatchId },
    });
    expect(batch.source).toBe("price-capture-job");
    expect(batch.status).toBe("COMPLETED");
    expect(batch.importedRecords).toBe(1);
    expect(batch.failedRecords).toBe(0);

    const productAfterCapture = await client.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(productAfterCapture.updatedAt.getTime()).toBeGreaterThan(
      productBeforeCapture.updatedAt.getTime(),
    );
  });
});
