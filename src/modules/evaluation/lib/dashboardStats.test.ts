import { describe, expect, it } from "vitest";
import { buildDashboardStats } from "./dashboardStats";
import type { RankingView, RankingViewEntry } from "../types";
import type { ViewedProductEntry } from "./recentActivity";

function entry({
  slug,
  brandName,
  finalScore,
}: {
  slug: string;
  brandName: string;
  finalScore: number;
}): RankingViewEntry {
  return {
    position: 1,
    finalScore,
    classificationTier: "GOOD",
    overallScore: finalScore,
    scoreComponents: { quality: finalScore, price: null, pricePerDose: null, pricePerGram: null },
    badges: [],
    criteriaScores: {},
    product: {
      id: slug,
      slug,
      name: slug,
      categorySlug: "creatina",
      brand: { slug: brandName, name: brandName },
      manufacturer: null,
      imageUrl: null,
      sku: null,
      price: null,
    },
  };
}

function ranking(entries: readonly RankingViewEntry[]): RankingView {
  return {
    categorySlug: "creatina",
    methodologyId: "m1",
    methodologyVersion: "1",
    generatedAt: "",
    entries,
  };
}

function view(slug: string, visitCount: number): ViewedProductEntry {
  return { slug, viewedAt: Date.now(), firstViewedAt: Date.now(), visitCount };
}

describe("buildDashboardStats", () => {
  it("resolves no aggregates (but still counts raw history) when there is no ranking yet", () => {
    const stats = buildDashboardStats([view("a", 1)], null);
    expect(stats.productsViewedCount).toBe(1);
    expect(stats.mostViewedProduct).toBeNull();
    expect(stats.topBrand).toBeNull();
  });

  it("counts unique products viewed, using visitCount (not history row count) for visits", () => {
    const rankingData = ranking([
      entry({ slug: "a", brandName: "Growth", finalScore: 80 }),
      entry({ slug: "b", brandName: "Dux", finalScore: 70 }),
    ]);
    // Histórico já deduplicado por slug — uma linha por produto, `visitCount` é quem carrega o total real.
    const stats = buildDashboardStats([view("a", 5), view("b", 1)], rankingData);

    expect(stats.productsViewedCount).toBe(2);
    expect(stats.mostViewedProduct?.product.slug).toBe("a");
    expect(stats.mostViewedProducts[0]).toEqual({ entry: rankingData.entries[0], visits: 5 });
  });

  it("computes the top brand weighted by visit count, not by distinct product count", () => {
    const rankingData = ranking([
      entry({ slug: "a", brandName: "Growth", finalScore: 80 }),
      entry({ slug: "b", brandName: "Dux", finalScore: 70 }),
      entry({ slug: "c", brandName: "Dux", finalScore: 60 }),
    ]);
    // "Growth" visitado 10x num único produto deve vencer "Dux" (1+1 visitas em 2 produtos).
    const stats = buildDashboardStats([view("a", 10), view("b", 1), view("c", 1)], rankingData);

    expect(stats.topBrand).toBe("Growth");
  });

  it("computes the score average weighted by visit count", () => {
    const rankingData = ranking([
      entry({ slug: "a", brandName: "Growth", finalScore: 100 }),
      entry({ slug: "b", brandName: "Dux", finalScore: 0 }),
    ]);
    // 3 visitas em nota 100, 1 visita em nota 0 → média ponderada 75.
    const stats = buildDashboardStats([view("a", 3), view("b", 1)], rankingData);

    expect(stats.averageScore).toBe(75);
  });

  it("excludes an unresolvable slug from brand/score aggregates but still counts it as viewed", () => {
    const rankingData = ranking([entry({ slug: "a", brandName: "Growth", finalScore: 80 })]);
    const stats = buildDashboardStats([view("a", 1), view("unpublished-product", 4)], rankingData);

    // productsViewedCount reflete o histórico bruto (o usuário realmente
    // visitou os dois) — só o produto resolvível entra nas agregações
    // que dependem do ranking (marca, nota, mais visitado).
    expect(stats.productsViewedCount).toBe(2);
    expect(stats.mostViewedProduct?.product.slug).toBe("a");
  });
});
