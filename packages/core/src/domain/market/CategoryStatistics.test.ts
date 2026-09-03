import { describe, expect, it } from "vitest";
import { calculateCategoryStatistics } from "./CategoryStatistics";

describe("calculateCategoryStatistics", () => {
  it("returns null for an empty category", () => {
    expect(calculateCategoryStatistics([])).toBeNull();
  });

  it("computes average, median and standard deviation from real scores", () => {
    const stats = calculateCategoryStatistics([
      { finalScore: 60, priceCents: 5000 },
      { finalScore: 80, priceCents: 7000 },
      { finalScore: 100, priceCents: 9000 },
    ]);

    expect(stats!.productCount).toBe(3);
    expect(stats!.averageScore).toBeCloseTo(80);
    expect(stats!.medianScore).toBe(80);
    expect(stats!.scoreStandardDeviation).toBeCloseTo(16.33, 1);
  });

  it("buckets scores into 20-point ranges covering 0-100", () => {
    const stats = calculateCategoryStatistics([
      { finalScore: 10, priceCents: null },
      { finalScore: 65, priceCents: null },
      { finalScore: 95, priceCents: null },
      { finalScore: 100, priceCents: null },
    ]);

    expect(stats!.scoreDistribution).toHaveLength(5);
    const total = stats!.scoreDistribution.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(4);
  });

  it("builds a price distribution across the real min-max range and finds the predominant bucket", () => {
    const stats = calculateCategoryStatistics([
      { finalScore: 70, priceCents: 1000 },
      { finalScore: 70, priceCents: 1100 },
      { finalScore: 70, priceCents: 1200 },
      { finalScore: 70, priceCents: 5000 },
    ]);

    expect(stats!.priceDistribution.length).toBeGreaterThan(0);
    const totalCounted = stats!.priceDistribution.reduce((sum, b) => sum + b.count, 0);
    expect(totalCounted).toBe(4);
    expect(stats!.predominantPriceRange).not.toBeNull();
    expect(stats!.predominantPriceRange!.count).toBeGreaterThanOrEqual(3);
  });

  it("collapses the price distribution to a single bucket when all prices are equal", () => {
    const stats = calculateCategoryStatistics([
      { finalScore: 70, priceCents: 5000 },
      { finalScore: 80, priceCents: 5000 },
    ]);

    expect(stats!.priceDistribution).toHaveLength(1);
    expect(stats!.priceDistribution[0]!.count).toBe(2);
  });

  it("returns a null predominant price range when no product has a known price", () => {
    const stats = calculateCategoryStatistics([
      { finalScore: 70, priceCents: null },
      { finalScore: 80, priceCents: null },
    ]);

    expect(stats!.priceDistribution).toEqual([]);
    expect(stats!.predominantPriceRange).toBeNull();
  });
});
