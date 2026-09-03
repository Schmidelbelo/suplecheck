import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/modules/evaluation/services/rankingView.service", () => ({
  loadRankingView: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { loadRankingView } from "@/modules/evaluation/services/rankingView.service";
import { getComparisonPageView, listComparisonSitemapEntries } from "./comparisonPage.service";

const findMany = vi.mocked(prisma.product.findMany);
const loadRanking = vi.mocked(loadRankingView);

describe("comparisonPage.service", () => {
  it("returns null when the pair is not made of real product slugs", async () => {
    findMany.mockResolvedValueOnce([{ slug: "a" }, { slug: "b" }] as never);

    await expect(getComparisonPageView("a-vs-x")).resolves.toBeNull();
  });

  it("loads comparison data only for products in the same real category", async () => {
    findMany
      .mockResolvedValueOnce([{ slug: "a" }, { slug: "b" }] as never)
      .mockResolvedValueOnce([
        { slug: "a", category: { slug: "creatina" } },
        { slug: "b", category: { slug: "creatina" } },
      ] as never);

    loadRanking.mockResolvedValueOnce({
      categorySlug: "creatina",
      methodologyId: "creatina",
      methodologyVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      entries: [
        rankingEntry("a", "Produto A", 92, 94),
        rankingEntry("b", "Produto B", 87, 83),
      ],
    });

    const view = await getComparisonPageView("a-vs-b");

    expect(view?.canonicalPair).toBe("a-vs-b");
    expect(view?.data.winner).toBe("a");
    expect(view?.data.advantagesA).toContain("Custo-benefício");
  });

  it("creates canonical comparison URLs per category for the sitemap", async () => {
    findMany.mockResolvedValueOnce([
      { slug: "b", category: { slug: "creatina" }, updatedAt: new Date("2026-01-02") },
      { slug: "a", category: { slug: "creatina" }, updatedAt: new Date("2026-01-01") },
      { slug: "whey-a", category: { slug: "whey" }, updatedAt: new Date("2026-01-03") },
    ] as never);

    await expect(listComparisonSitemapEntries()).resolves.toEqual([
      { pair: "a-vs-b", updatedAt: new Date("2026-01-02") },
    ]);
  });
});

function rankingEntry(slug: string, name: string, finalScore: number, overallScore: number) {
  return {
    position: slug === "a" ? 1 : 2,
    finalScore,
    classificationTier: "GOOD",
    overallScore,
    scoreComponents: { quality: finalScore, price: null, pricePerDose: null, pricePerGram: null },
    badges: [],
    criteriaScores: { "cost-benefit": finalScore },
    product: {
      id: slug,
      slug,
      name,
      imageUrl: null,
      brand: { slug: "marca", name: "Marca" },
      categorySlug: "creatina",
      manufacturer: null,
      sku: null,
      price: null,
    },
  };
}
