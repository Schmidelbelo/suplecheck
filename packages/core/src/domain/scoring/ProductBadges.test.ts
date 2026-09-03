import { describe, it, expect } from "vitest";
import { assignProductBadges, type ProductBadgeInput } from "./ProductBadges";

const inputs: ProductBadgeInput[] = [
  {
    productId: "a",
    priceCents: 5000,
    finalScore: 90,
    overallScore: 85,
    criteriaScores: { reputation: 60, "cost-benefit": 70 },
  },
  {
    productId: "b",
    priceCents: 3000,
    finalScore: 70,
    overallScore: 75,
    criteriaScores: { reputation: 95, "cost-benefit": 50 },
  },
  {
    productId: "c",
    priceCents: 4000,
    finalScore: 60,
    overallScore: 60,
    criteriaScores: { reputation: 40, "cost-benefit": 95 },
  },
];

describe("assignProductBadges", () => {
  it("atribui cada selo ao vencedor correto e único", () => {
    const result = assignProductBadges(inputs);

    expect(result.get("a")).toEqual([
      { emoji: "🏆", label: "Melhor Compra" },
      { emoji: "📊", label: "Maior Nota Geral" },
    ]);
    expect(result.get("b")).toEqual([
      { emoji: "⭐", label: "Melhor Avaliado" },
      { emoji: "💰", label: "Melhor Preço" },
    ]);
    expect(result.get("c")).toEqual([{ emoji: "🔥", label: "Melhor Custo-Benefício" }]);
  });

  it("não atribui selo quando há empate exato entre 2+ produtos", () => {
    const tied: ProductBadgeInput[] = [
      { productId: "x", priceCents: 1000, finalScore: 80, overallScore: 80, criteriaScores: {} },
      { productId: "y", priceCents: 1000, finalScore: 80, overallScore: 80, criteriaScores: {} },
    ];
    const result = assignProductBadges(tied);
    expect(result.get("x")).toEqual([]);
    expect(result.get("y")).toEqual([]);
  });

  it("não atribui selo de um fator quando nenhum produto tem esse dado", () => {
    const noReputation: ProductBadgeInput[] = [
      { productId: "x", priceCents: 1000, finalScore: 80, overallScore: 80, criteriaScores: {} },
      { productId: "y", priceCents: 2000, finalScore: 70, overallScore: 70, criteriaScores: {} },
    ];
    const result = assignProductBadges(noReputation);
    const allBadgeLabels = [...result.values()].flat().map((b) => b.label);
    expect(allBadgeLabels).not.toContain("Melhor Avaliado");
    expect(allBadgeLabels).not.toContain("Melhor Custo-Benefício");
  });
});
