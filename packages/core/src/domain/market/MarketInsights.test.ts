import { describe, expect, it } from "vitest";
import { generateMarketInsights } from "./MarketInsights";
import type { BrandRankingEntry } from "./BrandRanking";

const formatPriceCents = (cents: number) => `R$ ${(cents / 100).toFixed(2)}`;

function brandEntry(
  overrides: Partial<BrandRankingEntry> & { brandId: string },
): BrandRankingEntry {
  return {
    brandName: overrides.brandId,
    productCount: 1,
    averageScore: 0,
    averagePriceCents: null,
    bestProduct: { productId: "p", slug: "p", name: "p", finalScore: 0 },
    worstProduct: { productId: "p", slug: "p", name: "p", finalScore: 0 },
    ...overrides,
  };
}

describe("generateMarketInsights", () => {
  it("reports the percentage of products classified Bom or better", () => {
    const sentences = generateMarketInsights({
      classificationTiers: ["EXCELLENT", "GOOD", "GOOD", "POOR"],
      brandRanking: [],
      formatPriceCents,
    });

    expect(sentences).toContain("75% dos produtos possuem classificação Bom ou superior.");
  });

  it("reports the score gap between first and last ranking position", () => {
    const sentences = generateMarketInsights({
      classificationTiers: [],
      rankingScoresInOrder: [90, 85, 80, 78],
      brandRanking: [],
      formatPriceCents,
    });

    expect(sentences).toContain("A diferença entre o 1º e o 4º colocado é de apenas 12.0 pontos.");
  });

  it("does not claim a gap when the ranking has fewer than 2 entries", () => {
    const sentences = generateMarketInsights({
      classificationTiers: [],
      rankingScoresInOrder: [90],
      brandRanking: [],
      formatPriceCents,
    });

    expect(sentences.some((s) => s.includes("colocado"))).toBe(false);
  });

  it("names the top brand only when it strictly leads the ranking", () => {
    const tied = generateMarketInsights({
      classificationTiers: [],
      brandRanking: [
        brandEntry({ brandId: "b1", brandName: "Marca A", averageScore: 80 }),
        brandEntry({ brandId: "b2", brandName: "Marca B", averageScore: 80 }),
      ],
      formatPriceCents,
    });
    expect(tied.some((s) => s.includes("melhor média"))).toBe(false);

    const leading = generateMarketInsights({
      classificationTiers: [],
      brandRanking: [
        brandEntry({ brandId: "b1", brandName: "Marca A", averageScore: 90 }),
        brandEntry({ brandId: "b2", brandName: "Marca B", averageScore: 80 }),
      ],
      formatPriceCents,
    });
    expect(leading).toContain("A marca Marca A possui a melhor média do catálogo.");
  });

  it("reports the price range of the top 3 overall-score products only when they share the same bucket", () => {
    const sameBucket = generateMarketInsights({
      classificationTiers: [],
      brandRanking: [],
      topOverallScorePrices: [1000, 1050, 1100],
      priceDistribution: [
        { minCents: 1000, maxCents: 1100, count: 3 },
        { minCents: 1101, maxCents: 5000, count: 1 },
      ],
      formatPriceCents,
    });
    expect(sameBucket.some((s) => s.includes("três melhores compras"))).toBe(true);

    const differentBuckets = generateMarketInsights({
      classificationTiers: [],
      brandRanking: [],
      topOverallScorePrices: [1000, 1050, 5000],
      priceDistribution: [
        { minCents: 1000, maxCents: 1100, count: 2 },
        { minCents: 1101, maxCents: 5000, count: 1 },
      ],
      formatPriceCents,
    });
    expect(differentBuckets.some((s) => s.includes("três melhores compras"))).toBe(false);
  });

  it("returns no sentences for a completely empty input", () => {
    expect(
      generateMarketInsights({ classificationTiers: [], brandRanking: [], formatPriceCents }),
    ).toEqual([]);
  });
});
