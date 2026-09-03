import { describe, expect, it } from "vitest";
import { rankBrands, type BrandRankingProductInput } from "./BrandRanking";

function product(
  overrides: Partial<BrandRankingProductInput> & { productId: string; brandId: string },
): BrandRankingProductInput {
  return {
    productSlug: overrides.productId,
    productName: overrides.productId,
    brandName: overrides.brandId,
    priceCents: null,
    finalScore: 0,
    ...overrides,
  };
}

describe("rankBrands", () => {
  it("groups by brand and sorts by average score descending", () => {
    const products = [
      product({ productId: "a1", brandId: "b1", brandName: "Marca A", finalScore: 60 }),
      product({ productId: "a2", brandId: "b1", brandName: "Marca A", finalScore: 80 }),
      product({ productId: "b1", brandId: "b2", brandName: "Marca B", finalScore: 90 }),
    ];

    const ranking = rankBrands(products);

    expect(ranking).toHaveLength(2);
    expect(ranking[0]!.brandName).toBe("Marca B");
    expect(ranking[0]!.averageScore).toBe(90);
    expect(ranking[1]!.brandName).toBe("Marca A");
    expect(ranking[1]!.averageScore).toBe(70);
  });

  it("identifies the best and worst product of each brand", () => {
    const products = [
      product({ productId: "a1", brandId: "b1", productName: "Pior", finalScore: 40 }),
      product({ productId: "a2", brandId: "b1", productName: "Melhor", finalScore: 95 }),
    ];

    const [entry] = rankBrands(products);

    expect(entry!.bestProduct.name).toBe("Melhor");
    expect(entry!.worstProduct.name).toBe("Pior");
  });

  it("uses the same product as best and worst when the brand has a single product", () => {
    const products = [
      product({ productId: "a1", brandId: "b1", productName: "Único", finalScore: 70 }),
    ];

    const [entry] = rankBrands(products);

    expect(entry!.bestProduct.productId).toBe(entry!.worstProduct.productId);
  });

  it("ignores products with unknown price when computing average price", () => {
    const products = [
      product({ productId: "a1", brandId: "b1", priceCents: null, finalScore: 70 }),
      product({ productId: "a2", brandId: "b1", priceCents: 5000, finalScore: 70 }),
    ];

    const [entry] = rankBrands(products);

    expect(entry!.averagePriceCents).toBe(5000);
  });

  it("returns an empty ranking for an empty catalog", () => {
    expect(rankBrands([])).toEqual([]);
  });
});
