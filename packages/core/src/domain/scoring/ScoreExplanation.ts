export interface CriterionImpactInput {
  readonly criterionId: string;
  readonly score: number;
  readonly weight: number;
}

export interface CriterionImpact extends CriterionImpactInput {
  /** `score * weight` — o quanto este critério realmente pesou na nota final, não só a nota isolada. */
  readonly weightedImpact: number;
}

/**
 * Ordena os critérios de um breakdown pelo impacto real na nota final
 * (nota × peso, não só a nota isolada — um critério com nota alta mas
 * peso baixo pode influenciar menos que um com nota média e peso alto).
 * Única fonte desta ordenação no projeto — antes desta consolidação,
 * `explainScore` (página de produto) e `buildProductSummary`
 * (productInsights.ts) recalculavam o mesmo `sort` cada um por conta
 * própria.
 */
export function rankCriteriaByImpact(
  breakdown: readonly CriterionImpactInput[],
): CriterionImpact[] {
  return [...breakdown]
    .map((item) => ({ ...item, weightedImpact: item.score * item.weight }))
    .sort((a, b) => b.weightedImpact - a.weightedImpact);
}
