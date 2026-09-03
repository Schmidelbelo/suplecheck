import { average, median, standardDeviation } from "./MarketStatistics";

export interface CategoryStatisticsInput {
  readonly finalScore: number;
  readonly priceCents: number | null;
}

export interface ScoreBucket {
  readonly minScore: number;
  readonly maxScore: number;
  readonly count: number;
}

export interface PriceBucket {
  readonly minCents: number;
  readonly maxCents: number;
  readonly count: number;
}

export interface CategoryStatistics {
  readonly productCount: number;
  readonly scoreDistribution: readonly ScoreBucket[];
  readonly priceDistribution: readonly PriceBucket[];
  readonly predominantPriceRange: PriceBucket | null;
  readonly averageScore: number;
  readonly medianScore: number;
  readonly scoreStandardDeviation: number;
}

const SCORE_BUCKET_WIDTH = 20;

function buildScoreDistribution(scores: readonly number[]): readonly ScoreBucket[] {
  const buckets: ScoreBucket[] = [];
  for (let min = 0; min < 100; min += SCORE_BUCKET_WIDTH) {
    const max = min + SCORE_BUCKET_WIDTH;
    const count = scores.filter((s) => s >= min && (max === 100 ? s <= max : s < max)).length;
    buckets.push({ minScore: min, maxScore: max, count });
  }
  return buckets;
}

/** Divide o intervalo real [min, max] de preços em 4 faixas de largura igual — nunca faixas fixas em reais, sempre relativas ao próprio conjunto. */
function buildPriceDistribution(prices: readonly number[]): readonly PriceBucket[] {
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return [{ minCents: min, maxCents: max, count: prices.length }];

  const bucketCount = 4;
  const width = (max - min) / bucketCount;
  const buckets: PriceBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * width;
    const bucketMax = i === bucketCount - 1 ? max : min + (i + 1) * width;
    const count = prices.filter((p) =>
      i === bucketCount - 1 ? p >= bucketMin && p <= bucketMax : p >= bucketMin && p < bucketMax,
    ).length;
    buckets.push({ minCents: Math.round(bucketMin), maxCents: Math.round(bucketMax), count });
  }
  return buckets;
}

/**
 * Estatísticas de uma categoria a partir das avaliações mais recentes
 * dos produtos que a compõem — devolve `null` quando não há nenhum
 * produto avaliado (nada a calcular, nunca zeros inventados).
 */
export function calculateCategoryStatistics(
  entries: readonly CategoryStatisticsInput[],
): CategoryStatistics | null {
  if (entries.length === 0) return null;

  const scores = entries.map((e) => e.finalScore);
  const prices = entries.map((e) => e.priceCents).filter((v): v is number => v != null);
  const priceDistribution = buildPriceDistribution(prices);
  const predominantPriceRange =
    priceDistribution.length > 0
      ? [...priceDistribution].sort((a, b) => b.count - a.count)[0]!
      : null;

  return {
    productCount: entries.length,
    scoreDistribution: buildScoreDistribution(scores),
    priceDistribution,
    predominantPriceRange:
      predominantPriceRange && predominantPriceRange.count > 0 ? predominantPriceRange : null,
    averageScore: average(scores),
    medianScore: median(scores),
    scoreStandardDeviation: standardDeviation(scores),
  };
}
