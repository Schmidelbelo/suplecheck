import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { computePriceStats, type PriceStats } from "../services/price.service";
import type { RankingView, RankingViewEntry } from "@/modules/evaluation/types";

export interface ProductPriceInfo {
  readonly entry: RankingViewEntry;
  readonly stats: PriceStats | null;
  readonly capturedAt: string | null;
}

/**
 * Busca o histórico de preço de cada produto do ranking em paralelo —
 * catálogo pequeno hoje (10 produtos), custo aceitável. Se crescer para
 * centenas de produtos, isto precisaria de um endpoint de listagem em
 * lote em vez de N requisições; decisão de escala para revisitar quando
 * o catálogo justificar.
 */
export async function loadCatalogPriceInfo(ranking: RankingView): Promise<ProductPriceInfo[]> {
  return Promise.all(
    ranking.entries.map(async (entry) => {
      const skuId = entry.product.sku?.id;
      if (!skuId) return { entry, stats: null, capturedAt: null };

      const history = await fetchApiOrNull<{ priceCents: number; capturedAt: string }[]>(
        `/api/catalog/skus/${skuId}/prices`,
      );
      const points = history ?? [];
      return {
        entry,
        stats: computePriceStats(points),
        capturedAt: points[points.length - 1]?.capturedAt ?? null,
      };
    }),
  );
}

export function categoryAveragePriceCents(products: readonly ProductPriceInfo[]): number | null {
  const prices = products.map((p) => p.stats?.currentCents).filter((v): v is number => v != null);
  if (prices.length === 0) return null;
  return prices.reduce((sum, v) => sum + v, 0) / prices.length;
}

export interface OffersOverview {
  readonly priceDrops: readonly ProductPriceInfo[];
  readonly bestOpportunities: readonly ProductPriceInfo[];
  readonly allTimeLows: readonly ProductPriceInfo[];
  readonly recentCaptures: readonly ProductPriceInfo[];
  readonly categoryAverageCents: number | null;
}

export function buildOffersOverview(products: readonly ProductPriceInfo[]): OffersOverview {
  const withStats = products.filter((p) => p.stats !== null);
  const categoryAverageCents = categoryAveragePriceCents(products);

  const priceDrops = [...withStats]
    .filter((p) => p.stats!.changeDirection === "down")
    .sort((a, b) => (a.stats!.changePercent ?? 0) - (b.stats!.changePercent ?? 0));

  // "Melhor oportunidade" reaproveita o Score Geral já calculado (Core
  // Domain, ver docs/SCORING.md) — nunca uma segunda heurística de
  // "bom preço + boa nota" recriada aqui.
  const bestOpportunities = [...withStats]
    .sort((a, b) => b.entry.overallScore - a.entry.overallScore)
    .slice(0, 6);

  const allTimeLows = withStats.filter((p) => p.stats!.capturesCount > 1 && p.stats!.isAllTimeLow);

  const recentCaptures = [...products]
    .filter((p) => p.capturedAt !== null)
    .sort((a, b) => new Date(b.capturedAt!).getTime() - new Date(a.capturedAt!).getTime())
    .slice(0, 6);

  return { priceDrops, bestOpportunities, allTimeLows, recentCaptures, categoryAverageCents };
}
