import { describe, expect, it } from "vitest";
import { buildComparisonNarrative, type ComparisonCandidate } from "./ComparisonNarrative";

function candidate(
  overrides: Partial<ComparisonCandidate> & { productId: string; name: string },
): ComparisonCandidate {
  return {
    priceCents: null,
    finalScore: 0,
    overallScore: 0,
    ...overrides,
  };
}

describe("buildComparisonNarrative", () => {
  it("returns no sentences when fewer than 2 entries are given", () => {
    expect(buildComparisonNarrative([])).toEqual([]);
    expect(buildComparisonNarrative([candidate({ productId: "a", name: "A" })])).toEqual([]);
  });

  it("describes the price difference between the cheapest and priciest product", () => {
    const entries = [
      candidate({
        productId: "a",
        name: "Produto A",
        priceCents: 8200,
        finalScore: 8,
        overallScore: 70,
      }),
      candidate({
        productId: "b",
        name: "Produto B",
        priceCents: 10000,
        finalScore: 8,
        overallScore: 70,
      }),
    ];

    const sentences = buildComparisonNarrative(entries);

    expect(sentences).toContain("Produto A custa 18% menos que Produto B.");
  });

  it("describes the score difference between the best and worst rated product", () => {
    const entries = [
      candidate({
        productId: "a",
        name: "Produto A",
        priceCents: 10000,
        finalScore: 9,
        overallScore: 70,
      }),
      candidate({
        productId: "b",
        name: "Produto B",
        priceCents: 10000,
        finalScore: 3,
        overallScore: 70,
      }),
    ];

    const sentences = buildComparisonNarrative(entries);

    expect(sentences).toContain(
      "Produto A tem nota 6.0 pontos maior no Índice SupleCheck que Produto B.",
    );
  });

  it("recommends the product with the highest overall score when it strictly leads", () => {
    const entries = [
      candidate({
        productId: "a",
        name: "Produto A",
        priceCents: 10000,
        finalScore: 8,
        overallScore: 90,
      }),
      candidate({
        productId: "b",
        name: "Produto B",
        priceCents: 10000,
        finalScore: 8,
        overallScore: 60,
      }),
    ];

    const sentences = buildComparisonNarrative(entries);

    expect(sentences).toContain("Pelo Score Geral, recomendamos Produto A.");
  });

  it("never claims a difference when products are tied", () => {
    const entries = [
      candidate({
        productId: "a",
        name: "Produto A",
        priceCents: 10000,
        finalScore: 8,
        overallScore: 70,
      }),
      candidate({
        productId: "b",
        name: "Produto B",
        priceCents: 10000,
        finalScore: 8,
        overallScore: 70,
      }),
    ];

    const sentences = buildComparisonNarrative(entries);

    expect(sentences).toEqual([]);
  });

  it("ignores products with unknown price when comparing prices", () => {
    const entries = [
      candidate({
        productId: "a",
        name: "Produto A",
        priceCents: null,
        finalScore: 8,
        overallScore: 90,
      }),
      candidate({
        productId: "b",
        name: "Produto B",
        priceCents: 10000,
        finalScore: 3,
        overallScore: 60,
      }),
    ];

    const sentences = buildComparisonNarrative(entries);

    expect(sentences.some((s) => s.includes("custa") && s.includes("menos"))).toBe(false);
  });
});
