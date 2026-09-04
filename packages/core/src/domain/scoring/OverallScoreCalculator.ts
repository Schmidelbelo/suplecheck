import { DEFAULT_OVERALL_SCORE_WEIGHTS, type OverallScoreWeights } from "./OverallScoreWeights";

export interface OverallScoreInput {
  readonly productId: string;
  /** Índice SupleScore (0–100) já calculado pela metodologia vigente. */
  readonly qualityScore: number;
  readonly priceCents: number | null;
  readonly pricePerDoseCents: number | null;
  /** `null` quando o SKU não tem `dosagePerServing`/`servingsPerUnit` suficientes para calcular. */
  readonly pricePerGramCents: number | null;
}

export interface OverallScoreResult {
  readonly productId: string;
  /** 0–100, combinação de qualidade + sinais de preço, conforme os pesos usados. */
  readonly overallScore: number;
  /** Cada componente normalizado 0–100 dentro do conjunto comparado — útil para explicar o resultado. */
  readonly components: {
    readonly quality: number;
    readonly price: number | null;
    readonly pricePerDose: number | null;
    readonly pricePerGram: number | null;
  };
}

/** Normaliza um valor (menor é melhor) para 0–100 dentro do conjunto — min vira 100, max vira 0. Empate total (todos iguais) vira 100 para todos (nenhuma desvantagem relativa). */
function normalizeLowerIsBetter(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return 100 * ((max - value) / (max - min));
}

/**
 * Calcula o Score Geral de cada produto de um conjunto comparável
 * (mesma categoria/ranking) — nunca de um produto isolado, porque
 * "preço" só tem sentido relativo (R$50 é caro ou barato depende do
 * que mais existe no grupo). Cada sinal de preço é normalizado por
 * min-max dentro do próprio conjunto recebido; produtos sem um dado
 * específico (ex.: sem `pricePerGramCents`) têm esse componente
 * ignorado e o peso redistribuído proporcionalmente entre os
 * componentes que aquele produto de fato tem — nunca penalizado por
 * dado ausente, e nunca com um "score fantasma" inventado.
 */
export function calculateOverallScores(
  inputs: readonly OverallScoreInput[],
  weights: OverallScoreWeights = DEFAULT_OVERALL_SCORE_WEIGHTS,
): OverallScoreResult[] {
  const prices = inputs.map((i) => i.priceCents).filter((v): v is number => v != null);
  const pricesPerDose = inputs
    .map((i) => i.pricePerDoseCents)
    .filter((v): v is number => v != null);
  const pricesPerGram = inputs
    .map((i) => i.pricePerGramCents)
    .filter((v): v is number => v != null);

  const priceRange =
    prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  const doseRange =
    pricesPerDose.length > 0
      ? { min: Math.min(...pricesPerDose), max: Math.max(...pricesPerDose) }
      : null;
  const gramRange =
    pricesPerGram.length > 0
      ? { min: Math.min(...pricesPerGram), max: Math.max(...pricesPerGram) }
      : null;

  return inputs.map((input) => {
    const priceScore =
      input.priceCents != null && priceRange
        ? normalizeLowerIsBetter(input.priceCents, priceRange.min, priceRange.max)
        : null;
    const doseScore =
      input.pricePerDoseCents != null && doseRange
        ? normalizeLowerIsBetter(input.pricePerDoseCents, doseRange.min, doseRange.max)
        : null;
    const gramScore =
      input.pricePerGramCents != null && gramRange
        ? normalizeLowerIsBetter(input.pricePerGramCents, gramRange.min, gramRange.max)
        : null;

    const parts: { score: number; weight: number }[] = [
      { score: input.qualityScore, weight: weights.quality },
    ];
    if (priceScore != null) parts.push({ score: priceScore, weight: weights.price });
    if (doseScore != null) parts.push({ score: doseScore, weight: weights.pricePerDose });
    if (gramScore != null) parts.push({ score: gramScore, weight: weights.pricePerGram });

    const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
    const overallScore =
      totalWeight > 0
        ? parts.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight
        : input.qualityScore;

    return {
      productId: input.productId,
      overallScore,
      components: {
        quality: input.qualityScore,
        price: priceScore,
        pricePerDose: doseScore,
        pricePerGram: gramScore,
      },
    };
  });
}
