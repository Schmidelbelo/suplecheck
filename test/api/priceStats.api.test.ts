import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { uniqueSuffix } from "../setupTestContainer";

/**
 * `/api/monitoring/price-stats` — evolução de preço em lote. Cria seus
 * próprios dados de captura (categoria/marca/produto/SKU/loja com
 * slug único) e limpa tudo no `afterAll`, no mesmo padrão de
 * `test/api/catalog.api.test.ts`.
 */
const suffix = uniqueSuffix();
const client = new PrismaClient();

let categoryId: string;
let brandId: string;
let productId: string;
let skuWithHistoryId: string;
let skuSingleCaptureId: string;
let skuNoCaptureId: string;
let storeId: string;

async function setup() {
  const category = await client.category.create({
    data: { slug: `price-stats-cat-${suffix}`, name: "Categoria Price Stats" },
  });
  categoryId = category.id;

  const brand = await client.brand.create({
    data: { slug: `price-stats-brand-${suffix}`, name: "Marca Price Stats" },
  });
  brandId = brand.id;

  const store = await client.store.create({
    data: { slug: `price-stats-store-${suffix}`, name: "Loja Price Stats" },
  });
  storeId = store.id;

  const product = await client.product.create({
    data: {
      slug: `price-stats-product-${suffix}`,
      name: "Produto Price Stats",
      categoryId,
      brandId,
      status: "PUBLISHED",
    },
  });
  productId = product.id;

  const [skuWithHistory, skuSingleCapture, skuNoCapture] = await Promise.all([
    client.sku.create({ data: { productId, variantLabel: "300g" } }),
    client.sku.create({ data: { productId, variantLabel: "150g" } }),
    client.sku.create({ data: { productId, variantLabel: "600g" } }),
  ]);
  skuWithHistoryId = skuWithHistory.id;
  skuSingleCaptureId = skuSingleCapture.id;
  skuNoCaptureId = skuNoCapture.id;

  await client.priceEntry.createMany({
    data: [
      { skuId: skuWithHistoryId, storeId, priceCents: 10000 },
      { skuId: skuWithHistoryId, storeId, priceCents: 8000 },
    ],
  });
  await client.priceEntry.create({
    data: { skuId: skuSingleCaptureId, storeId, priceCents: 5000 },
  });
}

async function cleanup() {
  await client.priceEntry.deleteMany({
    where: { skuId: { in: [skuWithHistoryId, skuSingleCaptureId, skuNoCaptureId] } },
  });
  await client.sku.deleteMany({ where: { productId } });
  await client.product.deleteMany({ where: { id: productId } });
  await client.brand.deleteMany({ where: { id: brandId } });
  await client.category.deleteMany({ where: { id: categoryId } });
  await client.store.deleteMany({ where: { id: storeId } });
  await client.$disconnect();
}

describe("API /api/monitoring/price-stats", () => {
  it("retorna estatísticas por SKU numa única chamada, incluindo casos sem histórico suficiente", async () => {
    await setup();
    try {
      const { GET } = await import("../../src/app/api/monitoring/price-stats/route");
      const res = await GET(
        new Request(
          `http://localhost/api/monitoring/price-stats?skuIds=${skuWithHistoryId},${skuSingleCaptureId},${skuNoCaptureId}`,
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body[skuWithHistoryId].stats.capturesCount).toBe(2);
      expect(body[skuWithHistoryId].stats.currentCents).toBe(8000);
      expect(body[skuWithHistoryId].stats.minCents).toBe(8000);
      expect(body[skuWithHistoryId].stats.maxCents).toBe(10000);
      expect(body[skuWithHistoryId].stats.changeDirection).toBe("down");

      expect(body[skuSingleCaptureId].stats.capturesCount).toBe(1);
      expect(body[skuSingleCaptureId].stats.changeDirection).toBeNull();

      expect(body[skuNoCaptureId].stats).toBeNull();
    } finally {
      await cleanup();
    }
  });

  it("devolve objeto vazio quando nenhum skuIds é informado", async () => {
    const { GET } = await import("../../src/app/api/monitoring/price-stats/route");
    const res = await GET(new Request("http://localhost/api/monitoring/price-stats"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });
});
