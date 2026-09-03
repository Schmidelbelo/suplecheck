import { describe, expect, it } from "vitest";
import { buildRecommendation, type RecommendationCandidate } from "./RecommendationEngine";

function candidate(
  overrides: Partial<RecommendationCandidate> & { productId: string; productName: string },
): RecommendationCandidate {
  return {
    productSlug: overrides.productId,
    brandName: "Marca",
    classificationTier: "GOOD",
    priceCents: null,
    qualityScore: 70,
    overallScore: 70,
    pricePerDoseCents: null,
    pricePerGramCents: null,
    transparencyScore: null,
    criteriaBreakdown: [
      { criterionId: "cost-benefit", score: 70, weight: 0.3 },
      { criterionId: "label-transparency", score: 60, weight: 0.2 },
      { criterionId: "reputation", score: 80, weight: 0.2 },
      { criterionId: "price-per-dose", score: 65, weight: 0.3 },
    ],
    ...overrides,
  };
}

describe("buildRecommendation", () => {
  it("recommends the cheapest product first under the economy priority", () => {
    const result = buildRecommendation(
      [
        candidate({ productId: "a", productName: "Caro", priceCents: 15000, qualityScore: 80 }),
        candidate({ productId: "b", productName: "Barato", priceCents: 5000, qualityScore: 70 }),
      ],
      { priority: "economy", maxBudgetCents: null },
    );

    expect(result.recommended?.productId).toBe("b");
  });

  it("recommends the highest-quality product first under the bestRating priority", () => {
    const result = buildRecommendation(
      [
        candidate({ productId: "a", productName: "Premium", priceCents: 20000, qualityScore: 95 }),
        candidate({ productId: "b", productName: "Básico", priceCents: 4000, qualityScore: 55 }),
      ],
      { priority: "bestRating", maxBudgetCents: null },
    );

    expect(result.recommended?.productId).toBe("a");
  });

  it("excludes products over budget before ranking", () => {
    const result = buildRecommendation(
      [
        candidate({
          productId: "a",
          productName: "Fora do orçamento",
          priceCents: 30000,
          qualityScore: 99,
        }),
        candidate({
          productId: "b",
          productName: "Dentro do orçamento",
          priceCents: 5000,
          qualityScore: 60,
        }),
      ],
      { priority: "bestRating", maxBudgetCents: 10000 },
    );

    expect(result.ranking.some((e) => e.productId === "a")).toBe(false);
    expect(result.recommended?.productId).toBe("b");
  });

  it("identifies the cheapest product separately from the recommended one", () => {
    const result = buildRecommendation(
      [
        candidate({
          productId: "a",
          productName: "Melhor nota",
          priceCents: 12000,
          qualityScore: 95,
        }),
        candidate({
          productId: "b",
          productName: "Mais barato",
          priceCents: 3000,
          qualityScore: 50,
        }),
      ],
      { priority: "bestRating", maxBudgetCents: null },
    );

    expect(result.recommended?.productId).toBe("a");
    expect(result.cheapest?.productId).toBe("b");
  });

  it("splits the criteria breakdown into advantages and disadvantages without overlap", () => {
    const result = buildRecommendation([candidate({ productId: "a", productName: "Único" })], {
      priority: "costBenefit",
      maxBudgetCents: null,
    });

    const entry = result.recommended!;
    const advantageIds = entry.topAdvantages.map((c) => c.criterionId);
    const disadvantageIds = entry.topDisadvantages.map((c) => c.criterionId);
    expect(advantageIds.some((id) => disadvantageIds.includes(id))).toBe(false);
  });

  it("generates a comparison narrative across recommended/runner-up/cheapest", () => {
    const result = buildRecommendation(
      [
        candidate({ productId: "a", productName: "Produto A", priceCents: 8000, qualityScore: 90 }),
        candidate({
          productId: "b",
          productName: "Produto B",
          priceCents: 12000,
          qualityScore: 60,
        }),
        candidate({ productId: "c", productName: "Produto C", priceCents: 4000, qualityScore: 50 }),
      ],
      { priority: "bestRating", maxBudgetCents: null },
    );

    expect(result.comparisonNarrative.length).toBeGreaterThan(0);
  });

  it("returns nulls and an empty ranking for an empty candidate set", () => {
    const result = buildRecommendation([], { priority: "economy", maxBudgetCents: null });

    expect(result.ranking).toEqual([]);
    expect(result.recommended).toBeNull();
    expect(result.runnerUp).toBeNull();
    expect(result.cheapest).toBeNull();
  });

  it("returns the weights actually used for the chosen priority", () => {
    const result = buildRecommendation([candidate({ productId: "a", productName: "A" })], {
      priority: "transparency",
      maxBudgetCents: null,
    });

    expect(result.weightsUsed.transparency).toBeGreaterThan(result.weightsUsed.price);
  });
});
