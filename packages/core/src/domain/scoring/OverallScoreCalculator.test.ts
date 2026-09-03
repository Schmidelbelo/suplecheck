import { describe, it, expect } from "vitest";
import { calculateOverallScores, type OverallScoreInput } from "./OverallScoreCalculator";
import { DEFAULT_OVERALL_SCORE_WEIGHTS } from "./OverallScoreWeights";

const baseInputs: OverallScoreInput[] = [
  {
    productId: "a",
    qualityScore: 90,
    priceCents: 5000,
    pricePerDoseCents: 100,
    pricePerGramCents: 10,
  },
  {
    productId: "b",
    qualityScore: 70,
    priceCents: 3000,
    pricePerDoseCents: 60,
    pricePerGramCents: 6,
  },
  {
    productId: "c",
    qualityScore: 50,
    priceCents: 4000,
    pricePerDoseCents: 80,
    pricePerGramCents: 8,
  },
];

describe("calculateOverallScores", () => {
  it("dá ao mais barato e mais barato-por-dose um score de preço maior que ao mais caro", () => {
    const results = calculateOverallScores(baseInputs);
    const a = results.find((r) => r.productId === "a")!;
    const b = results.find((r) => r.productId === "b")!;
    expect(b.components.price).toBeGreaterThan(a.components.price!);
  });

  it("produto mais barato em tudo, mas de qualidade mais baixa, pode ainda perder no Score Geral se o peso de qualidade for alto", () => {
    const results = calculateOverallScores(baseInputs, {
      ...DEFAULT_OVERALL_SCORE_WEIGHTS,
      quality: 0.9,
      price: 0.033,
      pricePerDose: 0.033,
      pricePerGram: 0.034,
    });
    const a = results.find((r) => r.productId === "a")!;
    const b = results.find((r) => r.productId === "b")!;
    expect(a.overallScore).toBeGreaterThan(b.overallScore);
  });

  it("ignora componentes de preço ausentes sem penalizar o produto", () => {
    const inputs: OverallScoreInput[] = [
      {
        productId: "x",
        qualityScore: 80,
        priceCents: null,
        pricePerDoseCents: null,
        pricePerGramCents: null,
      },
      {
        productId: "y",
        qualityScore: 80,
        priceCents: 1000,
        pricePerDoseCents: 50,
        pricePerGramCents: 5,
      },
    ];
    const results = calculateOverallScores(inputs);
    const x = results.find((r) => r.productId === "x")!;
    // Sem nenhum dado de preço, o Score Geral cai só na qualidade (não recebe 0 nem null).
    expect(x.overallScore).toBe(80);
  });

  it("normaliza preços iguais entre si como 100 (nenhuma desvantagem relativa)", () => {
    const inputs: OverallScoreInput[] = [
      {
        productId: "p1",
        qualityScore: 80,
        priceCents: 1000,
        pricePerDoseCents: null,
        pricePerGramCents: null,
      },
      {
        productId: "p2",
        qualityScore: 80,
        priceCents: 1000,
        pricePerDoseCents: null,
        pricePerGramCents: null,
      },
    ];
    const results = calculateOverallScores(inputs);
    expect(results[0]!.components.price).toBe(100);
    expect(results[1]!.components.price).toBe(100);
  });
});
