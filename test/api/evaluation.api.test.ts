import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { uniqueSuffix } from "../setupTestContainer";

/**
 * API Test — chama os handlers de `src/app/api/evaluation/**` diretamente
 * contra `prisma/test.db`, como em `test/api/catalog.api.test.ts`.
 * `DATABASE_URL` precisa ser trocada ANTES do primeiro `import` de
 * `@/lib/container` (lido no module scope), por isso os `import()` dinâmicos.
 */
const dbPath = path.resolve(process.cwd(), "prisma/test.db");

beforeAll(() => {
  process.env.DATABASE_URL = `file:${dbPath}`;
});

const suffix = uniqueSuffix();
const cleanupClient = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
const createdMethodologyIds: string[] = [];

afterAll(async () => {
  const products = await cleanupClient.product.findMany({ where: { slug: { contains: suffix } } });
  const productIds = products.map((p) => p.id);
  await cleanupClient.rankingEntry.deleteMany({ where: { productId: { in: productIds } } });
  const categories = await cleanupClient.category.findMany({
    where: { slug: { contains: suffix } },
  });
  await cleanupClient.ranking.deleteMany({
    where: { categoryId: { in: categories.map((c) => c.id) } },
  });
  await cleanupClient.productScore.deleteMany({ where: { productId: { in: productIds } } });
  await cleanupClient.product.deleteMany({ where: { id: { in: productIds } } });
  await cleanupClient.brand.deleteMany({ where: { slug: { contains: suffix } } });
  await cleanupClient.category.deleteMany({ where: { id: { in: categories.map((c) => c.id) } } });
  await cleanupClient.methodology.deleteMany({ where: { id: { in: createdMethodologyIds } } });
  await cleanupClient.$disconnect();
});

const facts = {
  composition: {
    activeIngredientAmountPerServing: 4800,
    referenceRangePerServing: { min: 3000, max: 5000 },
    additives: [],
    undisclosedSubstances: [],
  },
  pricing: { priceInCents: 4990, dosesPerUnit: 60, categoryAveragePricePerDoseInCents: 90 },
  label: { hasProprietaryBlend: false, nutritionalInfoComplete: true, dosageClearlyStated: true },
  reputation: { averageRating: 4.5, reviewCount: 500 },
  marketingClaims: { claims: ["aumenta força"], scientificallySupportedClaims: ["aumenta força"] },
  store: { trustScore: 85, hasBuyerProtection: true },
};

describe("API /api/evaluation", () => {
  it("calcula score (POST), consulta (GET), recalcula (POST) e lê histórico (GET)", async () => {
    const { POST: POST_CAT } = await import("../../src/app/api/catalog/categories/route");
    const { POST: POST_BRAND } = await import("../../src/app/api/catalog/brands/route");
    const { POST: POST_PRODUCT } = await import("../../src/app/api/catalog/products/route");
    const { POST: POST_SCORE, GET: GET_SCORE } =
      await import("../../src/app/api/evaluation/products/[idOrSlug]/score/route");
    const { POST: POST_RECALCULATE } =
      await import("../../src/app/api/evaluation/products/[idOrSlug]/score/recalculate/route");
    const { GET: GET_HISTORY } =
      await import("../../src/app/api/evaluation/products/[idOrSlug]/score/history/route");

    const category = await (
      await POST_CAT(
        new Request("http://localhost/api/catalog/categories", {
          method: "POST",
          body: JSON.stringify({ slug: `api-eval-cat-${suffix}`, name: "Categoria" }),
        }),
      )
    ).json();
    const brand = await (
      await POST_BRAND(
        new Request("http://localhost/api/catalog/brands", {
          method: "POST",
          body: JSON.stringify({ slug: `api-eval-brand-${suffix}`, name: "Marca" }),
        }),
      )
    ).json();
    const product = await (
      await POST_PRODUCT(
        new Request("http://localhost/api/catalog/products", {
          method: "POST",
          body: JSON.stringify({
            slug: `api-eval-product-${suffix}`,
            name: "Produto",
            categorySlug: category.slug,
            brandSlug: brand.slug,
          }),
        }),
      )
    ).json();

    // sem metodologia ativa para a categoria -> 400/404 esperado
    const noMethodologyRes = await POST_SCORE(
      new Request("http://localhost/api/evaluation/products/x/score", {
        method: "POST",
        body: JSON.stringify({ facts }),
      }),
      { params: Promise.resolve({ idOrSlug: product.slug }) },
    );
    expect(noMethodologyRes.status).toBe(404);

    const { createMethodology } = await import("../../src/lib/container").then(
      (m) => m.container.useCases,
    );
    const methodology = await createMethodology.execute({
      id: `api-eval-methodology-${suffix}`,
      name: "Metodologia API",
      criteria: [
        { criterionId: "cost-benefit", weight: 0.5 },
        { criterionId: "reputation", weight: 0.5 },
      ],
    });
    createdMethodologyIds.push(methodology.id);
    const { container } = await import("../../src/lib/container");
    await container.ports.methodologies.setActiveForCategory(
      category.slug,
      methodology.id,
      methodology.version,
    );

    const calculateRes = await POST_SCORE(
      new Request("http://localhost/api/evaluation/products/x/score", {
        method: "POST",
        body: JSON.stringify({ facts }),
      }),
      { params: Promise.resolve({ idOrSlug: product.slug }) },
    );
    expect(calculateRes.status).toBe(201);
    const score = await calculateRes.json();
    expect(score.finalScore).toBeGreaterThan(0);

    const getRes = await GET_SCORE(
      new Request("http://localhost/api/evaluation/products/x/score"),
      {
        params: Promise.resolve({ idOrSlug: product.slug }),
      },
    );
    expect((await getRes.json()).finalScore).toBe(score.finalScore);

    const recalcRes = await POST_RECALCULATE(
      new Request("http://localhost/api/evaluation/products/x/score/recalculate", {
        method: "POST",
        body: JSON.stringify({
          facts: { ...facts, reputation: { averageRating: 4.9, reviewCount: 900 } },
        }),
      }),
      { params: Promise.resolve({ idOrSlug: product.slug }) },
    );
    expect(recalcRes.status).toBe(200);

    const historyRes = await GET_HISTORY(
      new Request("http://localhost/api/evaluation/products/x/score/history"),
      {
        params: Promise.resolve({ idOrSlug: product.slug }),
      },
    );
    const history = await historyRes.json();
    expect(history.items).toHaveLength(2);
  });

  it("gera (POST) e lê (GET) o ranking de uma categoria", async () => {
    const { POST: POST_CAT } = await import("../../src/app/api/catalog/categories/route");
    const { POST: POST_BRAND } = await import("../../src/app/api/catalog/brands/route");
    const { POST: POST_PRODUCT } = await import("../../src/app/api/catalog/products/route");
    const { POST: POST_SCORE } =
      await import("../../src/app/api/evaluation/products/[idOrSlug]/score/route");
    const { GET: GET_RANKING, POST: POST_RANKING } =
      await import("../../src/app/api/evaluation/rankings/[categorySlug]/route");
    const { GET: GET_RANKING_VIEW } =
      await import("../../src/app/api/evaluation/rankings/[categorySlug]/view/route");

    const category = await (
      await POST_CAT(
        new Request("http://localhost/api/catalog/categories", {
          method: "POST",
          body: JSON.stringify({ slug: `api-eval-rank-cat-${suffix}`, name: "Categoria Ranking" }),
        }),
      )
    ).json();
    const brand = await (
      await POST_BRAND(
        new Request("http://localhost/api/catalog/brands", {
          method: "POST",
          body: JSON.stringify({ slug: `api-eval-rank-brand-${suffix}`, name: "Marca Ranking" }),
        }),
      )
    ).json();
    const product = await (
      await POST_PRODUCT(
        new Request("http://localhost/api/catalog/products", {
          method: "POST",
          body: JSON.stringify({
            slug: `api-eval-rank-product-${suffix}`,
            name: "Produto Ranking",
            categorySlug: category.slug,
            brandSlug: brand.slug,
          }),
        }),
      )
    ).json();

    const { container } = await import("../../src/lib/container");
    const methodology = await container.useCases.createMethodology.execute({
      id: `api-eval-rank-methodology-${suffix}`,
      name: "Metodologia Ranking API",
      criteria: [{ criterionId: "cost-benefit", weight: 1 }],
    });
    createdMethodologyIds.push(methodology.id);
    await container.ports.methodologies.setActiveForCategory(
      category.slug,
      methodology.id,
      methodology.version,
    );

    await POST_SCORE(
      new Request("http://localhost/api/evaluation/products/x/score", {
        method: "POST",
        body: JSON.stringify({ facts }),
      }),
      { params: Promise.resolve({ idOrSlug: product.slug }) },
    );

    const generateRes = await POST_RANKING(
      new Request("http://localhost/api/evaluation/rankings/x", { method: "POST" }),
      {
        params: Promise.resolve({ categorySlug: category.slug }),
      },
    );
    expect(generateRes.status).toBe(201);
    const generated = await generateRes.json();
    expect(generated.entries).toHaveLength(1);

    const getRes = await GET_RANKING(new Request("http://localhost/api/evaluation/rankings/x"), {
      params: Promise.resolve({ categorySlug: category.slug }),
    });
    expect((await getRes.json()).entries).toHaveLength(1);

    const viewRes = await GET_RANKING_VIEW(
      new Request("http://localhost/api/evaluation/rankings/x/view"),
      {
        params: Promise.resolve({ categorySlug: category.slug }),
      },
    );
    const view = await viewRes.json();
    expect(view.entries[0].product.slug).toBe(product.slug);
  });
});
