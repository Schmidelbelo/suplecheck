import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { runPriceCaptureJob } from "../../src/modules/pricing/pipeline/PriceCaptureJobRunner";
import type {
  PriceScraperPort,
  PriceScraperResult,
} from "../../src/modules/pricing/pipeline/PriceScraperPort";
import { uniqueSuffix } from "../setupTestContainer";

/**
 * Integration Test do pipeline de captura de preço — ponta a ponta
 * contra o PostgreSQL (Neon) real, com dados de teste isolados
 * (prefixo único) para nunca tocar o catálogo real de produção durante
 * a suíte. Cobre a regressão do bug em que `PriceEntry.url` nunca era
 * persistido: toda captura, real (`LastKnownPriceScraperProvider`) ou
 * simulada por um scraper de teste, agora tem sua URL conferida
 * explicitamente em cada cenário abaixo.
 */
const client = new PrismaClient();
const suffix = uniqueSuffix();

/** Scraper de teste — devolve exatamente o preço/URL configurados, sem nenhuma requisição externa. */
class FixedScraperProvider implements PriceScraperPort {
  constructor(private readonly result: PriceScraperResult) {}
  async fetchPrice(): Promise<PriceScraperResult> {
    return this.result;
  }
}

const createdIds = {
  categoryId: "",
  brandId: "",
  productIds: [] as string[],
  skuIds: [] as string[],
  storeIds: [] as string[],
  importBatchIds: [] as string[],
};

afterAll(async () => {
  await client.importRecordError.deleteMany({
    where: { importBatchId: { in: createdIds.importBatchIds } },
  });
  await client.priceEntry.deleteMany({ where: { skuId: { in: createdIds.skuIds } } });
  await client.importBatch.deleteMany({ where: { id: { in: createdIds.importBatchIds } } });
  await client.sku.deleteMany({ where: { id: { in: createdIds.skuIds } } });
  await client.product.deleteMany({ where: { id: { in: createdIds.productIds } } });
  await client.brand.deleteMany({ where: { id: createdIds.brandId } });
  await client.category.deleteMany({ where: { id: createdIds.categoryId } });
  await client.store.deleteMany({ where: { id: { in: createdIds.storeIds } } });
  await client.$disconnect();
});

async function setupCategoryAndBrand() {
  if (createdIds.categoryId) return;
  const category = await client.category.create({
    data: { slug: `pc-cat-${suffix}`, name: `Categoria Price Capture ${suffix}` },
  });
  createdIds.categoryId = category.id;

  const brand = await client.brand.create({
    data: { slug: `pc-brand-${suffix}`, name: `Marca Price Capture ${suffix}` },
  });
  createdIds.brandId = brand.id;
}

async function createStore(nameSuffix: string) {
  const store = await client.store.create({
    data: { slug: `pc-store-${nameSuffix}-${suffix}`, name: `Loja ${nameSuffix} ${suffix}` },
  });
  createdIds.storeIds.push(store.id);
  return store;
}

async function createProductWithSku(nameSuffix: string) {
  await setupCategoryAndBrand();
  const product = await client.product.create({
    data: {
      slug: `pc-product-${nameSuffix}-${suffix}`,
      name: `Produto Price Capture ${nameSuffix} ${suffix}`,
      categoryId: createdIds.categoryId,
      brandId: createdIds.brandId,
      status: "PUBLISHED",
    },
  });
  createdIds.productIds.push(product.id);

  const sku = await client.sku.create({
    data: { productId: product.id, variantLabel: "300g", status: "ACTIVE" },
  });
  createdIds.skuIds.push(sku.id);

  return { product, sku };
}

describe("Pipeline de captura de preço — integração ponta a ponta", () => {
  it("captura, persiste histórico (incluindo a URL) e registra o job em ImportBatch", async () => {
    const store = await createStore("base");
    const { product, sku } = await createProductWithSku("base");

    await client.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: store.id,
        priceCents: 5000,
        availability: "IN_STOCK",
        url: "https://loja.example/produto-base",
      },
    });

    const productBeforeCapture = await client.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    const summary = await runPriceCaptureJob(undefined, { skuIds: [sku.id] });
    createdIds.importBatchIds.push(summary.importBatchId);

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
    // A regressão do bug original: antes da correção, esta captura
    // gravava `url: null` mesmo com uma URL conhecida.
    expect(history[1]!.url).toBe("https://loja.example/produto-base");

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

  it("produto recém-criado sem nenhuma captura anterior é ignorado pelo job (não sabemos em qual loja checar)", async () => {
    const { sku } = await createProductWithSku("recem-criado");
    // Nenhuma PriceEntry criada — SKU novo, sem histórico.

    const summary = await runPriceCaptureJob(undefined, { skuIds: [sku.id] });
    createdIds.importBatchIds.push(summary.importBatchId);

    expect(summary.totalProducts).toBe(0);

    const history = await client.priceEntry.findMany({ where: { skuId: sku.id } });
    expect(history).toHaveLength(0);
  });

  it("atualização de preço: uma captura com preço diferente persiste o novo valor mantendo a URL atual", async () => {
    const store = await createStore("atualiza-preco");
    const { sku } = await createProductWithSku("atualiza-preco");

    await client.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: store.id,
        priceCents: 8000,
        url: "https://loja.example/produto-preco",
      },
    });

    const scraper = new FixedScraperProvider({
      priceCents: 7000,
      availability: "IN_STOCK",
      url: "https://loja.example/produto-preco",
    });
    const summary = await runPriceCaptureJob(scraper, { skuIds: [sku.id] });
    createdIds.importBatchIds.push(summary.importBatchId);

    expect(summary.decreased).toBe(1);

    const latest = await client.priceEntry.findFirst({
      where: { skuId: sku.id },
      orderBy: { capturedAt: "desc" },
    });
    expect(latest?.priceCents).toBe(7000);
    expect(latest?.url).toBe("https://loja.example/produto-preco");
  });

  it("alteração de URL: quando o scraper reporta uma URL nova, a captura persiste a URL nova, não a antiga", async () => {
    const store = await createStore("altera-url");
    const { sku } = await createProductWithSku("altera-url");

    await client.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: store.id,
        priceCents: 5000,
        url: "https://loja.example/produto-antigo",
      },
    });

    const scraper = new FixedScraperProvider({
      priceCents: 5000,
      availability: "IN_STOCK",
      url: "https://loja.example/produto-novo-endereco",
    });
    const summary = await runPriceCaptureJob(scraper, { skuIds: [sku.id] });
    createdIds.importBatchIds.push(summary.importBatchId);

    const latest = await client.priceEntry.findFirst({
      where: { skuId: sku.id },
      orderBy: { capturedAt: "desc" },
    });
    expect(latest?.url).toBe("https://loja.example/produto-novo-endereco");

    // A captura anterior no histórico continua com a URL de quando foi
    // capturada — append-only, nunca reescrita.
    const first = await client.priceEntry.findFirst({
      where: { skuId: sku.id },
      orderBy: { capturedAt: "asc" },
    });
    expect(first?.url).toBe("https://loja.example/produto-antigo");
  });

  it("mudança de loja: a próxima captura sempre segue a loja/URL da captura mais recente, mesmo que tenha mudado desde a última execução do job", async () => {
    const storeA = await createStore("mudanca-loja-a");
    const storeB = await createStore("mudanca-loja-b");
    const { sku } = await createProductWithSku("mudanca-loja");

    await client.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: storeA.id,
        priceCents: 5000,
        url: "https://loja-a.example/produto",
      },
    });

    // Correção manual/importação externa muda a loja atual do produto
    // ANTES da próxima execução do job — o job precisa seguir essa
    // mudança, não a loja que ele mesmo capturou da última vez.
    await client.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: storeB.id,
        priceCents: 5200,
        url: "https://loja-b.example/produto",
      },
    });

    const summary = await runPriceCaptureJob(undefined, { skuIds: [sku.id] });
    createdIds.importBatchIds.push(summary.importBatchId);

    const latest = await client.priceEntry.findFirst({
      where: { skuId: sku.id },
      orderBy: { capturedAt: "desc" },
    });
    expect(latest?.storeId).toBe(storeB.id);
    expect(latest?.url).toBe("https://loja-b.example/produto");
    expect(latest?.priceCents).toBe(5200); // LastKnownPriceScraperProvider confirma o preço da loja B, não da A
  });

  it("múltiplas capturas sucessivas: o histórico cresce (append-only) e cada captura reflete a URL daquele momento", async () => {
    const store = await createStore("sucessivas");
    const { sku } = await createProductWithSku("sucessivas");

    await client.priceEntry.create({
      data: { skuId: sku.id, storeId: store.id, priceCents: 5000, url: "https://loja.example/v1" },
    });

    const summary1 = await runPriceCaptureJob(
      new FixedScraperProvider({
        priceCents: 5000,
        availability: "IN_STOCK",
        url: "https://loja.example/v1",
      }),
      { skuIds: [sku.id] },
    );
    createdIds.importBatchIds.push(summary1.importBatchId);

    const summary2 = await runPriceCaptureJob(
      new FixedScraperProvider({
        priceCents: 4800,
        availability: "IN_STOCK",
        url: "https://loja.example/v2",
      }),
      { skuIds: [sku.id] },
    );
    createdIds.importBatchIds.push(summary2.importBatchId);

    const summary3 = await runPriceCaptureJob(
      new FixedScraperProvider({
        priceCents: 4800,
        availability: "IN_STOCK",
        url: "https://loja.example/v2",
      }),
      { skuIds: [sku.id] },
    );
    createdIds.importBatchIds.push(summary3.importBatchId);

    const history = await client.priceEntry.findMany({
      where: { skuId: sku.id },
      orderBy: { capturedAt: "asc" },
    });
    // 1 semente + 3 capturas = 4 linhas, nenhuma sobrescrita.
    expect(history).toHaveLength(4);
    expect(history.map((h) => h.url)).toEqual([
      "https://loja.example/v1",
      "https://loja.example/v1",
      "https://loja.example/v2",
      "https://loja.example/v2",
    ]);
    expect(history.map((h) => h.priceCents)).toEqual([5000, 5000, 4800, 4800]);
  });
});
