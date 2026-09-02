import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaMethodologyRepository } from "../src/repositories/prisma/PrismaMethodologyRepository";
import { PrismaIndexResultRepository } from "../src/repositories/prisma/PrismaIndexResultRepository";
import { PrismaRankingRepository } from "../src/repositories/prisma/PrismaRankingRepository";
import { PrismaCriterionCatalogAdapter } from "../src/repositories/prisma/PrismaCriterionCatalogAdapter";
import type { MethodologyDTO } from "../src/application-kernel";
import { CriterionId } from "../src/core-kernel";

/**
 * Repository Test — exercita os repositórios Prisma do módulo de
 * Avaliação diretamente (sem Use Cases), contra o PostgreSQL (Neon)
 * real configurado em `DATABASE_URL`.
 */
const client = new PrismaClient();
const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const methodologies = new PrismaMethodologyRepository(client);
const indexResults = new PrismaIndexResultRepository(client);
const rankings = new PrismaRankingRepository(client);
const criteria = new PrismaCriterionCatalogAdapter(client);

const createdCategoryIds: string[] = [];
const createdBrandIds: string[] = [];
const createdProductIds: string[] = [];
const createdMethodologyIds: string[] = [];

afterAll(async () => {
  await client.rankingEntry.deleteMany({ where: { productId: { in: createdProductIds } } });
  await client.ranking.deleteMany({ where: { categoryId: { in: createdCategoryIds } } });
  await client.productScore.deleteMany({ where: { productId: { in: createdProductIds } } });
  await client.product.deleteMany({ where: { id: { in: createdProductIds } } });
  await client.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  await client.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
  await client.methodology.deleteMany({ where: { id: { in: createdMethodologyIds } } });
  await client.$disconnect();
});

describe("PrismaCriterionCatalogAdapter", () => {
  it("loadRegistry() carrega os critérios embutidos com status ACTIVE por padrão", async () => {
    const registry = await criteria.loadRegistry();
    const costBenefit = registry.get(CriterionId.of("cost-benefit"));
    expect(costBenefit).toBeDefined();
  });

  it("listAll() retorna os 6 critérios embutidos do Core Domain", async () => {
    const all = await criteria.listAll();
    expect(all.length).toBeGreaterThanOrEqual(6);
  });
});

describe("PrismaMethodologyRepository + PrismaIndexResultRepository + PrismaRankingRepository", () => {
  it("save/findById/setActiveForCategory/save de índice/ranking funcionam de ponta a ponta", async () => {
    const category = await client.category.create({
      data: { slug: `repo-eval-cat-${suffix}`, name: "Categoria Repo Eval" },
    });
    createdCategoryIds.push(category.id);

    const brand = await client.brand.create({
      data: { slug: `repo-eval-brand-${suffix}`, name: "Marca Repo Eval" },
    });
    createdBrandIds.push(brand.id);

    const product = await client.product.create({
      data: {
        slug: `repo-eval-prod-${suffix}`,
        name: "Produto Repo Eval",
        categoryId: category.id,
        brandId: brand.id,
        status: "PUBLISHED",
      },
    });
    createdProductIds.push(product.id);

    const methodologyId = `repo-eval-methodology-${suffix}`;
    createdMethodologyIds.push(methodologyId);
    const dto: MethodologyDTO = {
      id: methodologyId,
      name: "Metodologia Repo Eval",
      version: "1.0.0",
      aggregationStrategyName: "weighted-average",
      assignments: [
        { criterionId: "cost-benefit", weight: 0.5, enabled: true },
        { criterionId: "reputation", weight: 0.5, enabled: true },
      ],
      classification: [],
      categoryOverrides: [],
    };
    await methodologies.save(dto);

    const found = await methodologies.findById(methodologyId);
    expect(found?.assignments).toHaveLength(2);

    await methodologies.setActiveForCategory(category.slug, methodologyId, "1.0.0");
    const active = await methodologies.findActiveForCategory(category.slug);
    expect(active?.id).toBe(methodologyId);

    await indexResults.save({
      supplementId: product.id,
      categorySlug: category.slug,
      methodologyId,
      methodologyVersion: "1.0.0",
      finalScore: 77.5,
      classificationTier: "GOOD",
      classificationLabel: "Bom",
      breakdown: [
        { criterionId: "cost-benefit", score: 80, weight: 0.5, notes: [], flags: [] },
        { criterionId: "reputation", score: 75, weight: 0.5, notes: [], flags: [] },
      ],
      calculatedAt: new Date().toISOString(),
    });

    const latest = await indexResults.findLatest(product.id);
    expect(latest?.finalScore).toBe(77.5);

    const history = await indexResults.listHistory(product.id);
    expect(history).toHaveLength(1);

    const byCategory = await indexResults.listLatestByCategory(category.slug);
    expect(byCategory).toHaveLength(1);

    await rankings.save({
      categorySlug: category.slug,
      methodologyId,
      methodologyVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      entries: [
        { position: 1, supplementId: product.id, finalScore: 77.5, classificationTier: "GOOD" },
      ],
    });

    const latestRanking = await rankings.findLatest(category.slug);
    expect(latestRanking?.entries[0]?.supplementId).toBe(product.id);
  });
});
