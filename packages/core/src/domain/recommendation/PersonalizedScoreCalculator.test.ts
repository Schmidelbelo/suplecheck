import { describe, expect, it } from "vitest";
import {
  calculatePersonalizedScores,
  type PersonalizedScoreInput,
} from "./PersonalizedScoreCalculator";
import { resolvePersonalizedWeights } from "./PersonalizedWeights";

function input(
  overrides: Partial<PersonalizedScoreInput> & { productId: string },
): PersonalizedScoreInput {
  return {
    qualityScore: 70,
    priceCents: null,
    pricePerDoseCents: null,
    pricePerGramCents: null,
    transparencyScore: null,
    ...overrides,
  };
}

describe("calculatePersonalizedScores", () => {
  it("ranks the cheaper product higher under the economy priority", () => {
    const results = calculatePersonalizedScores(
      [
        input({ productId: "expensive", priceCents: 12000, qualityScore: 80 }),
        input({ productId: "cheap", priceCents: 6000, qualityScore: 75 }),
      ],
      resolvePersonalizedWeights("economy"),
    );

    const cheap = results.find((r) => r.productId === "cheap")!;
    const expensive = results.find((r) => r.productId === "expensive")!;
    expect(cheap.personalizedScore).toBeGreaterThan(expensive.personalizedScore);
  });

  it("ranks the higher-quality product higher under the bestRating priority even if pricier", () => {
    const results = calculatePersonalizedScores(
      [
        input({ productId: "premium", priceCents: 15000, qualityScore: 95 }),
        input({ productId: "budget", priceCents: 4000, qualityScore: 60 }),
      ],
      resolvePersonalizedWeights("bestRating"),
    );

    const premium = results.find((r) => r.productId === "premium")!;
    const budget = results.find((r) => r.productId === "budget")!;
    expect(premium.personalizedScore).toBeGreaterThan(budget.personalizedScore);
  });

  it("ranks the more transparent product higher under the transparency priority", () => {
    const results = calculatePersonalizedScores(
      [
        input({ productId: "opaque", qualityScore: 80, transparencyScore: 30 }),
        input({ productId: "transparent", qualityScore: 78, transparencyScore: 95 }),
      ],
      resolvePersonalizedWeights("transparency"),
    );

    const transparent = results.find((r) => r.productId === "transparent")!;
    const opaque = results.find((r) => r.productId === "opaque")!;
    expect(transparent.personalizedScore).toBeGreaterThan(opaque.personalizedScore);
  });

  it("redistributes weight and never penalizes a product for a missing component", () => {
    const results = calculatePersonalizedScores(
      [
        input({ productId: "a", qualityScore: 70, priceCents: 5000, transparencyScore: null }),
        input({ productId: "b", qualityScore: 70, priceCents: 5000, transparencyScore: 80 }),
      ],
      resolvePersonalizedWeights("costBenefit"),
    );

    expect(results.find((r) => r.productId === "a")!.components.transparency).toBeNull();
  });

  it("falls back to the quality score alone when a single product has no comparable component", () => {
    const results = calculatePersonalizedScores(
      [input({ productId: "solo", qualityScore: 88, priceCents: null })],
      resolvePersonalizedWeights("economy"),
    );

    expect(results[0]!.personalizedScore).toBe(88);
  });
});
