import type { BrandRankingEntry } from "./BrandRanking";
import type { PriceBucket } from "./CategoryStatistics";

/** Tiers considerados "nota alta" — os dois melhores do sistema de classificação padrão (ClassificationSystem.default()). */
const GOOD_OR_BETTER_TIERS = new Set(["EXCELLENT", "GOOD"]);

export interface MarketInsightsInput {
  /** Uma entrada por produto avaliado no conjunto considerado. */
  readonly classificationTiers: readonly string[];
  /** Notas do ranking (finalScore ou overallScore) já ordenadas por posição, 1º colocado primeiro. */
  readonly rankingScoresInOrder?: readonly number[];
  readonly brandRanking: readonly BrandRankingEntry[];
  /** Preços (em centavos) dos produtos com melhor Score Geral, já ordenados por posição, 1º primeiro. */
  readonly topOverallScorePrices?: readonly (number | null)[];
  readonly priceDistribution?: readonly PriceBucket[];
  /** Formata centavos em texto (ex.: "R$ 89,90") — injetado para manter o Core livre de formatação de apresentação. */
  readonly formatPriceCents: (cents: number) => string;
}

function findBucketContaining(
  distribution: readonly PriceBucket[],
  priceCents: number,
): PriceBucket | null {
  return (
    distribution.find((bucket) => priceCents >= bucket.minCents && priceCents <= bucket.maxCents) ??
    null
  );
}

/**
 * Gera frases de insight inteiramente a partir dos dados reais
 * recebidos — nenhuma delas é um texto fixo preenchido com números;
 * cada uma só é emitida quando o fato que ela descreve é
 * verdadeiro para o conjunto atual (ex.: nunca aponta uma "melhor
 * marca" em caso de empate no topo).
 */
export function generateMarketInsights(input: MarketInsightsInput): readonly string[] {
  const sentences: string[] = [];

  if (input.classificationTiers.length > 0) {
    const goodCount = input.classificationTiers.filter((t) => GOOD_OR_BETTER_TIERS.has(t)).length;
    const percent = Math.round((goodCount / input.classificationTiers.length) * 100);
    if (percent > 0) {
      sentences.push(`${percent}% dos produtos possuem classificação Bom ou superior.`);
    }
  }

  if (input.rankingScoresInOrder && input.rankingScoresInOrder.length >= 2) {
    const scores = input.rankingScoresInOrder;
    const first = scores[0]!;
    const last = scores[scores.length - 1]!;
    const diff = Math.round((first - last) * 10) / 10;
    if (diff > 0) {
      const qualifier = diff <= 15 ? "de apenas" : "de";
      sentences.push(
        `A diferença entre o 1º e o ${scores.length}º colocado é ${qualifier} ${diff.toFixed(1)} ponto${diff >= 2 ? "s" : ""}.`,
      );
    }
  }

  if (input.brandRanking.length >= 2) {
    const [top, second] = input.brandRanking;
    if (top!.averageScore > second!.averageScore) {
      sentences.push(`A marca ${top!.brandName} possui a melhor média do catálogo.`);
    }
  } else if (input.brandRanking.length === 1) {
    sentences.push(
      `A marca ${input.brandRanking[0]!.brandName} possui a melhor média do catálogo.`,
    );
  }

  if (
    input.topOverallScorePrices &&
    input.topOverallScorePrices.length >= 3 &&
    input.priceDistribution &&
    input.priceDistribution.length > 0
  ) {
    const topThreePrices = input.topOverallScorePrices
      .slice(0, 3)
      .filter((v): v is number => v != null);
    if (topThreePrices.length === 3) {
      const buckets = topThreePrices.map((price) =>
        findBucketContaining(input.priceDistribution!, price),
      );
      const [firstBucket] = buckets;
      const allSameBucket = firstBucket && buckets.every((b) => b === firstBucket);
      if (allSameBucket) {
        sentences.push(
          `As três melhores compras pertencem à faixa de preço entre ${input.formatPriceCents(firstBucket.minCents)} e ${input.formatPriceCents(firstBucket.maxCents)}.`,
        );
      }
    }
  }

  return sentences;
}
