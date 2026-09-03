import { describe, expect, it } from "vitest";
import { recommendAlternatives, type AlternativeCandidate } from "./AlternativeRecommendations";

function candidate(
  overrides: Partial<AlternativeCandidate> & { productId: string },
): AlternativeCandidate {
  return {
    priceCents: null,
    finalScore: 0,
    overallScore: 0,
    ...overrides,
  };
}

describe("recommendAlternatives", () => {
  it("recommends the cheapest, top rated and best balanced alternatives", () => {
    const current = candidate({
      productId: "current",
      priceCents: 10000,
      finalScore: 7,
      overallScore: 60,
    });
    const others = [
      candidate({ productId: "cheaper", priceCents: 8000, finalScore: 6, overallScore: 55 }),
      candidate({ productId: "better-rated", priceCents: 11000, finalScore: 9, overallScore: 58 }),
      candidate({
        productId: "best-balance",
        priceCents: 10500,
        finalScore: 7.5,
        overallScore: 80,
      }),
    ];

    const result = recommendAlternatives(current, others);

    expect(result.cheapest).toBe("cheaper");
    expect(result.topRated).toBe("better-rated");
    expect(result.bestBalance).toBe("best-balance");
  });

  it("never recommends a product that is equal or worse than the current one", () => {
    const current = candidate({
      productId: "current",
      priceCents: 10000,
      finalScore: 8,
      overallScore: 90,
    });
    const others = [
      candidate({ productId: "same-price", priceCents: 10000, finalScore: 8, overallScore: 90 }),
      candidate({ productId: "worse", priceCents: 12000, finalScore: 5, overallScore: 40 }),
    ];

    const result = recommendAlternatives(current, others);

    expect(result.cheapest).toBeNull();
    expect(result.topRated).toBeNull();
    expect(result.bestBalance).toBeNull();
  });

  it("picks the strictly cheapest among multiple cheaper candidates", () => {
    const current = candidate({
      productId: "current",
      priceCents: 10000,
      finalScore: 5,
      overallScore: 50,
    });
    const others = [
      candidate({ productId: "a", priceCents: 9000, finalScore: 4, overallScore: 40 }),
      candidate({ productId: "b", priceCents: 7000, finalScore: 4, overallScore: 40 }),
    ];

    const result = recommendAlternatives(current, others);

    expect(result.cheapest).toBe("b");
  });

  it("ignores candidates with unknown price when comparing cheapest", () => {
    const current = candidate({
      productId: "current",
      priceCents: null,
      finalScore: 5,
      overallScore: 50,
    });
    const others = [
      candidate({ productId: "a", priceCents: 5000, finalScore: 4, overallScore: 40 }),
    ];

    const result = recommendAlternatives(current, others);

    expect(result.cheapest).toBeNull();
  });

  it("returns all nulls when there are no other candidates", () => {
    const current = candidate({
      productId: "current",
      priceCents: 10000,
      finalScore: 5,
      overallScore: 50,
    });

    const result = recommendAlternatives(current, []);

    expect(result).toEqual({ cheapest: null, topRated: null, bestBalance: null });
  });
});
