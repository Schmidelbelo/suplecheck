import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { uniqueSuffix } from "../setupTestContainer";

/**
 * `/go/[productId]` — ponto único de saída para lojas. Cria seus
 * próprios dados (categoria/marca/produto/SKU/lojas com/sem afiliado)
 * e limpa tudo no `afterAll`, no mesmo padrão de `test/api/priceStats.api.test.ts`.
 */
const suffix = uniqueSuffix();
const client = new PrismaClient();

let categoryId: string;
let brandId: string;
let productWithOfferId: string;
let productWithOfferSlug: string;
let productWithOfferSkuId: string;
let productWithoutOfferId: string;
let productWithoutOfferSlug: string;
let storeDirectId: string;
let storeAffiliateConfiguredId: string;
let storeAffiliateUnconfiguredId: string;

async function setup() {
  const category = await client.category.create({
    data: { slug: `go-cat-${suffix}`, name: "Categoria Go" },
  });
  categoryId = category.id;

  const brand = await client.brand.create({
    data: { slug: `go-brand-${suffix}`, name: "Marca Go" },
  });
  brandId = brand.id;

  const storeDirect = await client.store.create({
    data: { slug: `go-store-direct-${suffix}`, name: "Loja Sem Afiliado", isAffiliate: false },
  });
  storeDirectId = storeDirect.id;

  const storeAffiliateConfigured = await client.store.create({
    data: {
      slug: `go-store-configured-${suffix}`,
      name: "Loja Afiliada Configurada",
      isAffiliate: true,
      affiliateBaseUrl: "https://rede-afiliados.example/click?merchant=go-test&url={url}",
    },
  });
  storeAffiliateConfiguredId = storeAffiliateConfigured.id;

  const storeAffiliateUnconfigured = await client.store.create({
    data: {
      slug: `go-store-unconfigured-${suffix}`,
      name: "Loja Afiliada Sem Base URL",
      isAffiliate: true,
      affiliateBaseUrl: null,
    },
  });
  storeAffiliateUnconfiguredId = storeAffiliateUnconfigured.id;

  const productWithOffer = await client.product.create({
    data: {
      slug: `go-product-offer-${suffix}`,
      name: "Produto Go Com Oferta",
      categoryId,
      brandId,
      status: "PUBLISHED",
    },
  });
  productWithOfferId = productWithOffer.id;
  productWithOfferSlug = productWithOffer.slug;

  const sku = await client.sku.create({
    data: { productId: productWithOfferId, variantLabel: "300g", status: "ACTIVE" },
  });
  productWithOfferSkuId = sku.id;
  await client.priceEntry.create({
    data: {
      skuId: sku.id,
      storeId: storeAffiliateConfiguredId,
      priceCents: 5000,
      url: "https://loja.example/produto-go-teste",
    },
  });

  const productWithoutOffer = await client.product.create({
    data: {
      slug: `go-product-no-offer-${suffix}`,
      name: "Produto Go Sem Oferta",
      categoryId,
      brandId,
      status: "PUBLISHED",
    },
  });
  productWithoutOfferId = productWithoutOffer.id;
  productWithoutOfferSlug = productWithoutOffer.slug;
}

async function cleanup() {
  await client.outboundClick.deleteMany({
    where: { productId: { in: [productWithOfferId, productWithoutOfferId] } },
  });
  await client.priceEntry.deleteMany({ where: { sku: { productId: productWithOfferId } } });
  await client.sku.deleteMany({
    where: { productId: { in: [productWithOfferId, productWithoutOfferId] } },
  });
  await client.product.deleteMany({
    where: { id: { in: [productWithOfferId, productWithoutOfferId] } },
  });
  await client.brand.deleteMany({ where: { id: brandId } });
  await client.category.deleteMany({ where: { id: categoryId } });
  await client.store.deleteMany({
    where: {
      id: { in: [storeDirectId, storeAffiliateConfiguredId, storeAffiliateUnconfiguredId] },
    },
  });
  await client.$disconnect();
}

describe("GET /go/[productId]", () => {
  it("redireciona (302) para a URL de afiliado real quando a loja tem affiliateBaseUrl configurado, e registra o clique", async () => {
    await setup();
    try {
      const { GET } = await import("../../src/app/go/[productId]/route");
      const res = await GET(
        new Request(`http://localhost/go/${productWithOfferSlug}?source=product-page&position=1`),
        { params: Promise.resolve({ productId: productWithOfferSlug }) },
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        `https://rede-afiliados.example/click?merchant=go-test&url=${encodeURIComponent("https://loja.example/produto-go-teste")}`,
      );

      const clicks = await client.outboundClick.findMany({
        where: { productId: productWithOfferId },
      });
      expect(clicks).toHaveLength(1);
      expect(clicks[0]).toMatchObject({
        storeId: storeAffiliateConfiguredId,
        categoryId,
        source: "product-page",
        position: 1,
        wasAffiliate: true,
      });
    } finally {
      await cleanup();
    }
  });

  it("retorna 404 real para um produto que não existe", async () => {
    const { GET } = await import("../../src/app/go/[productId]/route");
    const res = await GET(
      new Request("http://localhost/go/produto-inexistente-go-test?source=product-page"),
      {
        params: Promise.resolve({ productId: "produto-inexistente-go-test" }),
      },
    );

    expect(res.status).toBe(404);
  });

  it("redireciona (302) para a página do produto quando ele existe mas não tem nenhuma oferta cadastrada", async () => {
    await setup();
    try {
      const { GET } = await import("../../src/app/go/[productId]/route");
      const res = await GET(
        new Request(`http://localhost/go/${productWithoutOfferSlug}?source=product-page`),
        { params: Promise.resolve({ productId: productWithoutOfferSlug }) },
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain(`/creatina/${productWithoutOfferSlug}`);

      const clicks = await client.outboundClick.findMany({
        where: { productId: productWithoutOfferId },
      });
      expect(clicks).toHaveLength(0);
    } finally {
      await cleanup();
    }
  });

  it("cai para a URL direta quando a loja tem isAffiliate=false ou isAffiliate=true sem affiliateBaseUrl configurado — nunca inventa um link", async () => {
    await setup();
    try {
      // Segunda captura, mais recente, no MESMO SKU, apontando para a
      // loja SEM programa de afiliado — `resolveOutboundClick` sempre
      // usa a captura mais recente do SKU ativo, então isto passa a ser
      // a oferta corrente do produto de forma determinística.
      await client.priceEntry.create({
        data: {
          skuId: productWithOfferSkuId,
          storeId: storeDirectId,
          priceCents: 9000,
          url: "https://loja-direta.example/produto-go-teste",
        },
      });

      const { GET } = await import("../../src/app/go/[productId]/route");
      const res = await GET(
        new Request(`http://localhost/go/${productWithOfferSlug}?source=product-page`),
        { params: Promise.resolve({ productId: productWithOfferSlug }) },
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("https://loja-direta.example/produto-go-teste");

      // Terceira captura, ainda mais recente, na loja com isAffiliate=true
      // mas SEM affiliateBaseUrl configurado — mesmo fallback, nunca um
      // link inventado.
      await client.priceEntry.create({
        data: {
          skuId: productWithOfferSkuId,
          storeId: storeAffiliateUnconfiguredId,
          priceCents: 8500,
          url: "https://loja-sem-config.example/produto-go-teste",
        },
      });
      const resUnconfigured = await GET(
        new Request(`http://localhost/go/${productWithOfferSlug}?source=product-page`),
        { params: Promise.resolve({ productId: productWithOfferSlug }) },
      );
      expect(resUnconfigured.status).toBe(302);
      expect(resUnconfigured.headers.get("location")).toBe(
        "https://loja-sem-config.example/produto-go-teste",
      );

      const clicks = await client.outboundClick.findMany({
        where: { productId: productWithOfferId },
        orderBy: { createdAt: "asc" },
      });
      expect(clicks).toHaveLength(2);
      expect(clicks.every((c) => c.wasAffiliate === false)).toBe(true);
    } finally {
      await cleanup();
    }
  });
});
