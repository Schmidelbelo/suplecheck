import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTestContainer, uniqueSuffix } from "../setupTestContainer";
import type { InfrastructureContainer } from "@infrastructure/index";

/**
 * Integration Test — Use Case → Application Service → Port → Repository
 * Prisma → PostgreSQL (Neon) real, para o módulo de Avaliação: criar
 * metodologia, avaliar um produto (Core Domain calculando de verdade),
 * recalcular, ler histórico e gerar/ler um Ranking.
 */
describe("Avaliação — integração ponta a ponta", () => {
  let container: InfrastructureContainer;
  const suffix = uniqueSuffix();
  const createdCategoryIds: string[] = [];
  const createdBrandIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdMethodologyIds: string[] = [];

  beforeAll(() => {
    container = buildTestContainer();
  });

  afterAll(async () => {
    const client = container.prisma.client;
    await client.rankingEntry.deleteMany({ where: { productId: { in: createdProductIds } } });
    await client.ranking.deleteMany({ where: { categoryId: { in: createdCategoryIds } } });
    await client.productScore.deleteMany({ where: { productId: { in: createdProductIds } } });
    await client.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await client.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
    await client.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    await client.methodology.deleteMany({ where: { id: { in: createdMethodologyIds } } });
    await container.prisma.disconnect();
  });

  const facts = (score: "alta" | "baixa") => ({
    composition: {
      activeIngredientAmountPerServing: score === "alta" ? 5000 : 2000,
      referenceRangePerServing: { min: 3000, max: 5000 },
      additives: [],
      undisclosedSubstances: [] as string[],
    },
    pricing: { priceInCents: 4990, dosesPerUnit: 60, categoryAveragePricePerDoseInCents: 90 },
    label: {
      hasProprietaryBlend: score !== "alta",
      nutritionalInfoComplete: true,
      dosageClearlyStated: true,
    },
    reputation: { averageRating: score === "alta" ? 4.7 : 3.1, reviewCount: 200 },
    marketingClaims: {
      claims: ["aumenta força"],
      scientificallySupportedClaims: score === "alta" ? ["aumenta força"] : [],
    },
    store: { trustScore: 85, hasBuyerProtection: true },
  });

  it("calcula, persiste (ProductScore + breakdown), recalcula e mantém histórico append-only", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-eval-cat-${suffix}`,
      name: "Categoria Eval",
    });
    createdCategoryIds.push(category.id);
    const brand = await container.useCases.createBrand.execute({
      slug: `it-eval-brand-${suffix}`,
      name: "Marca Eval",
    });
    createdBrandIds.push(brand.id);

    const methodology = await container.useCases.createMethodology.execute({
      id: `it-eval-methodology-${suffix}`,
      name: "Metodologia Eval",
      criteria: [
        { criterionId: "cost-benefit", weight: 0.3 },
        { criterionId: "price-per-dose", weight: 0.2 },
        { criterionId: "label-transparency", weight: 0.2 },
        { criterionId: "reputation", weight: 0.15 },
        { criterionId: "exaggerated-claims", weight: 0.1 },
        { criterionId: "store-reliability", weight: 0.05 },
      ],
    });
    createdMethodologyIds.push(methodology.id);
    await container.ports.methodologies.setActiveForCategory(
      category.slug,
      methodology.id,
      methodology.version,
    );

    const product = await container.useCases.registerSupplement.execute({
      slug: `it-eval-product-${suffix}`,
      name: "Produto Eval",
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(product.id);

    const firstScore = await container.useCases.evaluateSupplement.execute({
      supplementId: product.id,
      facts: facts("baixa"),
    });
    expect(firstScore.breakdown.length).toBeGreaterThan(0);

    const persisted = await container.prisma.client.productScore.findMany({
      where: { productId: product.id },
    });
    expect(persisted).toHaveLength(1);
    const breakdownRows = await container.prisma.client.productScoreCriterionBreakdown.findMany({
      where: { productScoreId: persisted[0]!.id },
    });
    expect(breakdownRows.length).toBe(firstScore.breakdown.length);

    const recalculated = await container.useCases.recalculateSupplementScore.execute({
      supplementId: product.id,
      facts: facts("alta"),
    });
    expect(recalculated.finalScore).toBeGreaterThan(firstScore.finalScore);

    const history = await container.useCases.listSupplementScoreHistory.execute(product.id);
    expect(history).toHaveLength(2);
    expect(history[0]!.finalScore).toBe(recalculated.finalScore);

    const latest = await container.useCases.getSupplementScore.execute(product.id);
    expect(latest.finalScore).toBe(recalculated.finalScore);
  });

  it("recalculateSupplementScore rejeita produto sem avaliação anterior", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-eval-cat2-${suffix}`,
      name: "Categoria Eval 2",
    });
    createdCategoryIds.push(category.id);
    const brand = await container.useCases.createBrand.execute({
      slug: `it-eval-brand2-${suffix}`,
      name: "Marca Eval 2",
    });
    createdBrandIds.push(brand.id);
    const product = await container.useCases.registerSupplement.execute({
      slug: `it-eval-product2-${suffix}`,
      name: "Produto Sem Nota",
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(product.id);

    await expect(
      container.useCases.recalculateSupplementScore.execute({
        supplementId: product.id,
        facts: facts("alta"),
      }),
    ).rejects.toThrow();
  });

  it("GenerateRankingUseCase gera e persiste um Ranking real ordenado por nota", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-eval-cat3-${suffix}`,
      name: "Categoria Ranking",
    });
    createdCategoryIds.push(category.id);
    const brand = await container.useCases.createBrand.execute({
      slug: `it-eval-brand3-${suffix}`,
      name: "Marca Ranking",
    });
    createdBrandIds.push(brand.id);
    const methodology = await container.useCases.createMethodology.execute({
      id: `it-eval-methodology3-${suffix}`,
      name: "Metodologia Ranking",
      criteria: [
        { criterionId: "cost-benefit", weight: 0.5 },
        { criterionId: "reputation", weight: 0.5 },
      ],
    });
    createdMethodologyIds.push(methodology.id);
    await container.ports.methodologies.setActiveForCategory(
      category.slug,
      methodology.id,
      methodology.version,
    );

    const productA = await container.useCases.registerSupplement.execute({
      slug: `it-eval-ranking-a-${suffix}`,
      name: "Produto Ranking A",
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(productA.id);
    const productB = await container.useCases.registerSupplement.execute({
      slug: `it-eval-ranking-b-${suffix}`,
      name: "Produto Ranking B",
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(productB.id);

    await container.useCases.evaluateSupplement.execute({
      supplementId: productA.id,
      facts: facts("alta"),
    });
    await container.useCases.evaluateSupplement.execute({
      supplementId: productB.id,
      facts: facts("baixa"),
    });

    const ranking = await container.useCases.generateRanking.execute({
      categorySlug: category.slug,
    });
    expect(ranking.entries).toHaveLength(2);
    expect(ranking.entries[0]!.supplementId).toBe(productA.id);
    expect(ranking.entries[0]!.position).toBe(1);

    const stored = await container.ports.rankings.findLatest(category.slug);
    expect(stored?.entries[0]?.supplementId).toBe(productA.id);
  });
});
