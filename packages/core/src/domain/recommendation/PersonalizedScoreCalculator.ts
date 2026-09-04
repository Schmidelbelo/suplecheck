import type { PersonalizedWeights } from "./PersonalizedWeights";

export interface PersonalizedScoreInput {
  readonly productId: string;
  /** Índice SupleScore (0–100) — o Score Geral em si NUNCA é alterado por este cálculo. */
  readonly qualityScore: number;
  readonly priceCents: number | null;
  readonly pricePerDoseCents: number | null;
  readonly pricePerGramCents: number | null;
  /** Nota (0–100) do critério real "Transparência do rótulo" — `null` quando ausente do breakdown. */
  readonly transparencyScore: number | null;
}

export interface PersonalizedScoreResult {
  readonly productId: string;
  /** 0–100 — válido apenas para esta sessão/perfil, nunca persistido nem substitui o Score Geral. */
  readonly personalizedScore: number;
  readonly components: {
    readonly quality: number;
    readonly price: number | null;
    readonly pricePerDose: number | null;
    readonly pricePerGram: number | null;
    readonly transparency: number | null;
  };
}

function normalizeLowerIsBetter(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return 100 * ((max - value) / (max - min));
}

function normalizeHigherIsBetter(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return 100 * ((value - min) / (max - min));
}

/**
 * Score Geral temporário, calculado só para a sessão do Assistente de
 * Escolha — mesma técnica de normalização min-max dentro do conjunto
 * comparado, e mesma regra de redistribuição de peso quando falta um
 * dado (`OverallScoreCalculator`), estendida com o componente
 * "transparência" (critério real `label-transparency`, não uma
 * invenção). Nunca escreve nem lê `ProductScore`/`OverallScoreResult` —
 * é uma reordenação em memória do mesmo conjunto de produtos.
 */
export function calculatePersonalizedScores(
  inputs: readonly PersonalizedScoreInput[],
  weights: PersonalizedWeights,
): PersonalizedScoreResult[] {
  const prices = inputs.map((i) => i.priceCents).filter((v): v is number => v != null);
  const pricesPerDose = inputs
    .map((i) => i.pricePerDoseCents)
    .filter((v): v is number => v != null);
  const pricesPerGram = inputs
    .map((i) => i.pricePerGramCents)
    .filter((v): v is number => v != null);
  const transparencyScores = inputs
    .map((i) => i.transparencyScore)
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
  const transparencyRange =
    transparencyScores.length > 0
      ? { min: Math.min(...transparencyScores), max: Math.max(...transparencyScores) }
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
    const transparencyScore =
      input.transparencyScore != null && transparencyRange
        ? normalizeHigherIsBetter(
            input.transparencyScore,
            transparencyRange.min,
            transparencyRange.max,
          )
        : null;

    const parts: { score: number; weight: number }[] = [
      { score: input.qualityScore, weight: weights.quality },
    ];
    if (priceScore != null) parts.push({ score: priceScore, weight: weights.price });
    if (doseScore != null) parts.push({ score: doseScore, weight: weights.pricePerDose });
    if (gramScore != null) parts.push({ score: gramScore, weight: weights.pricePerGram });
    if (transparencyScore != null)
      parts.push({ score: transparencyScore, weight: weights.transparency });

    const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
    const personalizedScore =
      totalWeight > 0
        ? parts.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight
        : input.qualityScore;

    return {
      productId: input.productId,
      personalizedScore,
      components: {
        quality: input.qualityScore,
        price: priceScore,
        pricePerDose: doseScore,
        pricePerGram: gramScore,
        transparency: transparencyScore,
      },
    };
  });
}
