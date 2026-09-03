import { fetchApiOrNull } from "@/lib/api/fetchApi";
import type { PriceStats } from "../services/price.service";
import type { RankingView, RankingViewEntry } from "@/modules/evaluation/types";

export interface ProductPriceInfo {
  readonly entry: RankingViewEntry;
  readonly stats: PriceStats | null;
  readonly capturedAt: string | null;
}

type PriceStatsBySkuResponse = Record<
  string,
  { stats: PriceStats | null; lastCapturedAt: string | null }
>;

/**
 * Evolução de preço de todo o ranking em UMA requisição
 * (`/api/monitoring/price-stats?skuIds=...`) — antes eram N requisições,
 * uma por produto (`loadCatalogPriceInfo` chamava
 * `/api/catalog/skus/[id]/prices` dentro de `Promise.all`). O cálculo
 * de min/máx/variação/tendência (`computePriceStats`) também passa a
 * rodar uma vez no servidor, não é refeito aqui.
 */
export async function loadCatalogPriceInfo(ranking: RankingView): Promise<ProductPriceInfo[]> {
  const entriesWithSku = ranking.entries.filter((entry) => entry.product.sku?.id);
  const skuIds = entriesWithSku.map((entry) => entry.product.sku!.id);

  const statsBySkuId =
    skuIds.length > 0
      ? ((await fetchApiOrNull<PriceStatsBySkuResponse>(
          `/api/monitoring/price-stats?skuIds=${skuIds.join(",")}`,
        )) ?? {})
      : {};

  return ranking.entries.map((entry) => {
    const skuId = entry.product.sku?.id;
    const info = skuId ? statsBySkuId[skuId] : undefined;
    return {
      entry,
      stats: info?.stats ?? null,
      capturedAt: info?.lastCapturedAt ?? null,
    };
  });
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
