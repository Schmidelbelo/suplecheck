import { describe, expect, it } from "vitest";
import {
  calculateMarketStatistics,
  average,
  median,
  standardDeviation,
  type MarketProductInput,
} from "./MarketStatistics";

function product(
  overrides: Partial<MarketProductInput> & { productId: string },
): MarketProductInput {
  return {
    brandId: "brand-1",
    priceCents: null,
    finalScore: 0,
    overallScore: 0,
    ...overrides,
  };
}

describe("calculateMarketStatistics", () => {
  it("computes counts, price range and score range from real products", () => {
    const products = [
      product({
        productId: "a",
        brandId: "b1",
        priceCents: 8000,
        finalScore: 70,
        overallScore: 60,
      }),
      product({
        productId: "b",
        brandId: "b1",
        priceCents: 12000,
        finalScore: 90,
        overallScore: 85,
      }),
      product({
        productId: "c",
        brandId: "b2",
        priceCents: 10000,
        finalScore: 50,
        overallScore: 40,
      }),
    ];

    const stats = calculateMarketStatistics(products);

    expect(stats.productCount).toBe(3);
    expect(stats.brandCount).toBe(2);
    expect(stats.minPriceCents).toBe(8000);
    expect(stats.maxPriceCents).toBe(12000);
    expect(stats.averagePriceCents).toBeCloseTo(10000);
    expect(stats.bestOverallScore).toBe(85);
    expect(stats.worstOverallScore).toBe(40);
    expect(stats.averageScore).toBeCloseTo(70);
  });

  it("returns null numeric fields when there are no products with price", () => {
    const products = [
      product({ productId: "a", priceCents: null, finalScore: 60, overallScore: 60 }),
    ];

    const stats = calculateMarketStatistics(products);

    expect(stats.minPriceCents).toBeNull();
    expect(stats.maxPriceCents).toBeNull();
    expect(stats.averagePriceCents).toBeNull();
  });

  it("returns all nulls/zeros for an empty market", () => {
    const stats = calculateMarketStatistics([]);

    expect(stats.productCount).toBe(0);
    expect(stats.brandCount).toBe(0);
    expect(stats.averagePriceCents).toBeNull();
    expect(stats.bestOverallScore).toBeNull();
    expect(stats.averageScore).toBeNull();
  });
});

describe("average/median/standardDeviation", () => {
  it("computes average", () => {
    expect(average([1, 2, 3])).toBe(2);
  });

  it("computes median for even and odd length arrays", () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("computes population standard deviation", () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 5);
  });

  it("returns 0 standard deviation for an empty array", () => {
    expect(standardDeviation([])).toBe(0);
  });
});
