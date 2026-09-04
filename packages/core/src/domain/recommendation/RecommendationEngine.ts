import { filterWithinBudget } from "./BudgetFilter";
import {
  calculatePersonalizedScores,
  type PersonalizedScoreResult,
} from "./PersonalizedScoreCalculator";
import {
  resolvePersonalizedWeights,
  type RecommendationPriority,
  type PersonalizedWeights,
} from "./PersonalizedWeights";
import {
  rankCriteriaByImpact,
  type CriterionImpactInput,
  type CriterionImpact,
} from "../scoring/ScoreExplanation";
import { buildComparisonNarrative } from "../scoring/ComparisonNarrative";

export interface RecommendationCandidate {
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly brandName: string;
  readonly classificationTier: string;
  readonly priceCents: number | null;
  /** Índice SupleScore (0–100). */
  readonly qualityScore: number;
  /** Score Geral (0–100) já calculado pelo Core Domain de scoring — exibido, nunca recalculado aqui. */
  readonly overallScore: number;
  readonly pricePerDoseCents: number | null;
  readonly pricePerGramCents: number | null;
  readonly transparencyScore: number | null;
  readonly criteriaBreakdown: readonly CriterionImpactInput[];
}

export interface RecommendationProfile {
  readonly priority: RecommendationPriority;
  readonly maxBudgetCents: number | null;
}

export interface RecommendationEntry {
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly brandName: string;
  readonly classificationTier: string;
  readonly priceCents: number | null;
  readonly qualityScore: number;
  readonly overallScore: number;
  readonly personalizedScore: number;
  readonly personalizedComponents: PersonalizedScoreResult["components"];
  readonly topAdvantages: readonly CriterionImpact[];
  readonly topDisadvantages: readonly CriterionImpact[];
}

export interface RecommendationResult {
  readonly weightsUsed: PersonalizedWeights;
  readonly ranking: readonly RecommendationEntry[];
  readonly recommended: RecommendationEntry | null;
  readonly runnerUp: RecommendationEntry | null;
  readonly cheapest: RecommendationEntry | null;
  /** Frases da comparação automática (Recomendado vs. Segundo melhor vs. Mais barato) — mesma função usada na comparação manual de produtos. */
  readonly comparisonNarrative: readonly string[];
}

/** Divide o breakdown em vantagens (maior impacto) e desvantagens (menor impacto) sem repetir o mesmo critério nos dois lados. */
function splitAdvantagesAndDisadvantages(breakdown: readonly CriterionImpactInput[]): {
  advantages: readonly CriterionImpact[];
  disadvantages: readonly CriterionImpact[];
} {
  const ranked = rankCriteriaByImpact(breakdown);
  const advantageCount = Math.min(2, Math.ceil(ranked.length / 2));
  const advantages = ranked.slice(0, advantageCount);
  const remaining = ranked.length - advantageCount;
  const disadvantages = remaining > 0 ? ranked.slice(-Math.min(2, remaining)) : [];
  return { advantages, disadvantages };
}

/**
 * Motor de recomendação personalizada — orquestra filtro de orçamento,
 * Score Personalizado (temporário, só desta chamada) e explicabilidade
 * (vantagens/desvantagens reais do breakdown), e escolhe os 3 produtos
 * da comparação automática (Recomendado / Segundo melhor / Mais
 * barato). Puro: nenhuma leitura de banco, nenhum estado — a mesma
 * chamada com os mesmos candidatos sempre devolve o mesmo resultado.
 */
export function buildRecommendation(
  candidates: readonly RecommendationCandidate[],
  profile: RecommendationProfile,
): RecommendationResult {
  const weights = resolvePersonalizedWeights(profile.priority);
  const withinBudget = filterWithinBudget(candidates, profile.maxBudgetCents);

  const personalizedScores = calculatePersonalizedScores(
    withinBudget.map((c) => ({
      productId: c.productId,
      qualityScore: c.qualityScore,
      priceCents: c.priceCents,
      pricePerDoseCents: c.pricePerDoseCents,
      pricePerGramCents: c.pricePerGramCents,
      transparencyScore: c.transparencyScore,
    })),
    weights,
  );
  const scoreByProduct = new Map(personalizedScores.map((r) => [r.productId, r]));

  const ranking: RecommendationEntry[] = withinBudget
    .map((candidate) => {
      const score = scoreByProduct.get(candidate.productId)!;
      const { advantages, disadvantages } = splitAdvantagesAndDisadvantages(
        candidate.criteriaBreakdown,
      );
      return {
        productId: candidate.productId,
        productName: candidate.productName,
        productSlug: candidate.productSlug,
        brandName: candidate.brandName,
        classificationTier: candidate.classificationTier,
        priceCents: candidate.priceCents,
        qualityScore: candidate.qualityScore,
        overallScore: candidate.overallScore,
        personalizedScore: score.personalizedScore,
        personalizedComponents: score.components,
        topAdvantages: advantages,
        topDisadvantages: disadvantages,
      };
    })
    .sort((a, b) => b.personalizedScore - a.personalizedScore);

  const recommended = ranking[0] ?? null;
  const runnerUp = ranking[1] ?? null;
  const cheapest =
    [...ranking]
      .filter((e) => e.priceCents != null)
      .sort((a, b) => a.priceCents! - b.priceCents!)[0] ?? null;

  const comparisonSet = [recommended, runnerUp, cheapest].filter(
    (e, index, all): e is RecommendationEntry =>
      e !== null && all.findIndex((other) => other?.productId === e.productId) === index,
  );
  const comparisonNarrative = buildComparisonNarrative(
    comparisonSet.map((e) => ({
      productId: e.productId,
      name: e.productName,
      priceCents: e.priceCents,
      finalScore: e.qualityScore,
      overallScore: e.overallScore,
    })),
  );

  return { weightsUsed: weights, ranking, recommended, runnerUp, cheapest, comparisonNarrative };
}
