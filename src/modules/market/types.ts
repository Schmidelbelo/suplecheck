import type { MarketStatistics, BrandRankingEntry, CategoryStatistics } from "@core/index";

export interface CategoryMarketViewResponse {
  readonly categorySlug: string;
  readonly statistics: CategoryStatistics;
  readonly insights: readonly string[];
}

export interface MarketApiResponse {
  readonly generatedAt: string;
  readonly statistics: MarketStatistics;
  readonly brandRanking: readonly BrandRankingEntry[];
  readonly insights: readonly string[];
  readonly category: CategoryMarketViewResponse | null;
}
