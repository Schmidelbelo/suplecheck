import { describe, expect, it } from "vitest";
import { buildComparisonPageData } from "./buildComparisonPage";
import type { RankingViewEntry } from "@/modules/evaluation/types";

function entry(
  overrides: Partial<RankingViewEntry> & {
    id: string;
    name: string;
    finalScore: number;
    overallScore: number;
    priceCents?: number | null;
    criteriaScores?: Record<string, number>;
  },
): RankingViewEntry {
  return {
    position: 1,
    finalScore: overrides.finalScore,
    classificationTier: "GOOD",
    overallScore: overrides.overallScore,
    scoreComponents: { quality: overrides.finalScore, price: null, pricePerDose: null, pricePerGram: null },
    badges: [],
    criteriaScores: overrides.criteriaScores ?? {},
    product: {
      id: overrides.id,
      slug: overrides.id,
      name: overrides.name,
      categorySlug: "creatina",
      brand: { slug: "marca", name: "Marca" },
      manufacturer: null,
      imageUrl: null,
      sku: null,
      price: overrides.priceCents != null ? { cents: overrides.priceCents, pricePerDoseCents: null, pricePerGramCents: null, url: null, store: { slug: "loja", name: "Loja" } } : null,
    },
  };
}

describe("buildComparisonPageData", () => {
  it("computes a per-criterion winner for each shared criterion", () => {
    const a = entry({ id: "a", name: "A", finalScore: 80, overallScore: 80, criteriaScores: { "cost-benefit": 90, reputation: 40 } });
    const b = entry({ id: "b", name: "B", finalScore: 70, overallScore: 70, criteriaScores: { "cost-benefit": 60, reputation: 80 } });

    const data = buildComparisonPageData(a, b);

    const costBenefit = data.criteriaDiff.find((c) => c.criterionId === "cost-benefit")!;
    expect(costBenefit.winner).toBe("a");
    const reputation = data.criteriaDiff.find((c) => c.criterionId === "reputation")!;
    expect(reputation.winner).toBe("b");
  });

  it("lists advantages only for criteria that are strictly better, never for ties", () => {
    const a = entry({ id: "a", name: "A", finalScore: 80, overallScore: 80, criteriaScores: { "cost-benefit": 90, reputation: 50 } });
    const b = entry({ id: "b", name: "B", finalScore: 70, overallScore: 70, criteriaScores: { "cost-benefit": 60, reputation: 50 } });

    const data = buildComparisonPageData(a, b);

    expect(data.advantagesA).toContain("Custo-benefício");
    expect(data.advantagesA).not.toContain("Reputação");
    expect(data.advantagesB).toEqual([]);
  });

  it("never guesses a winner for a criterion missing from one side", () => {
    const a = entry({ id: "a", name: "A", finalScore: 80, overallScore: 80, criteriaScores: { "cost-benefit": 90 } });
    const b = entry({ id: "b", name: "B", finalScore: 70, overallScore: 70, criteriaScores: {} });

    const data = buildComparisonPageData(a, b);

    const costBenefit = data.criteriaDiff.find((c) => c.criterionId === "cost-benefit")!;
    expect(costBenefit.winner).toBeNull();
    expect(costBenefit.scoreB).toBeNull();
  });

  it("picks the overall winner by Score Geral, and reports a tie when equal", () => {
    const a = entry({ id: "a", name: "A", finalScore: 80, overallScore: 90 });
    const b = entry({ id: "b", name: "B", finalScore: 70, overallScore: 60 });
    expect(buildComparisonPageData(a, b).winner).toBe("a");

    const tiedA = entry({ id: "a", name: "A", finalScore: 80, overallScore: 75 });
    const tiedB = entry({ id: "b", name: "B", finalScore: 70, overallScore: 75 });
    expect(buildComparisonPageData(tiedA, tiedB).winner).toBe("tie");
  });

  it("includes a natural-language narrative built from the real comparison function", () => {
    const a = entry({ id: "a", name: "Produto A", finalScore: 90, overallScore: 90, priceCents: 5000 });
    const b = entry({ id: "b", name: "Produto B", finalScore: 60, overallScore: 60, priceCents: 8000 });

    const data = buildComparisonPageData(a, b);

    expect(data.narrative.length).toBeGreaterThan(0);
  });
});
