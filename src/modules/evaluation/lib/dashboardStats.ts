import type { RankingView, RankingViewEntry } from "../types";
import type { ViewedProductEntry } from "./recentActivity";

/**
 * Toda estatística aqui é calculada a partir de dado real (histórico de
 * visitas local + ranking real) — nunca um número decorativo. Com
 * catálogo de uma única categoria hoje, "categoria favorita" sempre
 * resolve para "Creatina": é o resultado correto do cálculo real, não
 * um valor fixo — o código já está pronto para quando houver mais
 * categorias.
 */
export interface DashboardStats {
  readonly productsViewedCount: number;
  readonly categoriesVisited: readonly string[];
  readonly topBrand: string | null;
  readonly averageScore: number | null;
  readonly mostViewedProduct: RankingViewEntry | null;
  readonly topCategory: string | null;
  readonly mostViewedProducts: readonly { entry: RankingViewEntry; visits: number }[];
}

function resolveEntries(
  history: readonly ViewedProductEntry[],
  ranking: RankingView | null,
): { entry: RankingViewEntry; visits: number }[] {
  if (!ranking) return [];
  const bySlug = new Map(ranking.entries.map((e) => [e.product.slug, e]));

  const visitCounts = new Map<string, number>();
  for (const view of history) {
    visitCounts.set(view.slug, (visitCounts.get(view.slug) ?? 0) + 1);
  }

  return [...visitCounts.entries()]
    .map(([slug, visits]) => {
      const entry = bySlug.get(slug);
      return entry ? { entry, visits } : null;
    })
    .filter((v): v is { entry: RankingViewEntry; visits: number } => v !== null)
    .sort((a, b) => b.visits - a.visits);
}

export function buildDashboardStats(
  history: readonly ViewedProductEntry[],
  ranking: RankingView | null,
): DashboardStats {
  const resolved = resolveEntries(history, ranking);
  const uniqueSlugs = new Set(history.map((h) => h.slug));

  const categories = new Map<string, number>();
  const brands = new Map<string, number>();
  let scoreSum = 0;
  let scoreCount = 0;

  for (const { entry, visits } of resolved) {
    categories.set(
      entry.product.categorySlug,
      (categories.get(entry.product.categorySlug) ?? 0) + visits,
    );
    brands.set(entry.product.brand.name, (brands.get(entry.product.brand.name) ?? 0) + visits);
    scoreSum += entry.finalScore * visits;
    scoreCount += visits;
  }

  const topCategory = [...categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topBrand = [...brands.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    productsViewedCount: uniqueSlugs.size,
    categoriesVisited: [...categories.keys()],
    topBrand,
    averageScore: scoreCount > 0 ? scoreSum / scoreCount : null,
    mostViewedProduct: resolved[0]?.entry ?? null,
    topCategory,
    mostViewedProducts: resolved.slice(0, 5),
  };
}
