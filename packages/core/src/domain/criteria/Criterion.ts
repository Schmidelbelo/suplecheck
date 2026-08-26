import type { CriterionId } from "../value-objects/CriterionId";
import type { Score } from "../value-objects/Score";
import type { TechnicalNote, ValidationFlag } from "../value-objects/TechnicalNote";
import type { CriterionKind } from "../enums/EvidenceQuality";
import type { EvaluationContext } from "../evaluation/EvaluationContext";

export interface CriterionMetadata {
  readonly id: CriterionId;
  readonly name: string;
  readonly description: string;
  readonly kind: CriterionKind;
  /**
   * Categorias às quais este critério se aplica. `undefined` = aplicável
   * a qualquer categoria de suplemento. Permite regras específicas por
   * categoria (ex: um critério só faz sentido para pré-treino) sem que o
   * motor de cálculo precise conhecer categorias.
   */
  readonly applicableCategories?: readonly string[];
}

export interface CriterionEvaluationResult {
  readonly criterionId: CriterionId;
  readonly score: Score;
  readonly notes: readonly TechnicalNote[];
  readonly flags: readonly ValidationFlag[];
}

/**
 * Contrato que todo critério — embutido ou futuro — deve implementar.
 * É a única superfície que o `ScoringEngine` conhece (Strategy Pattern):
 * novos critérios são criados implementando esta interface e registrados
 * no `CriterionRegistry`, sem tocar no motor de cálculo (Open/Closed).
 */
export interface Criterion {
  readonly metadata: CriterionMetadata;
  evaluate(context: EvaluationContext): CriterionEvaluationResult;
}

export function appliesToCategory(criterion: Criterion, categorySlug: string): boolean {
  const scope = criterion.metadata.applicableCategories;
  return !scope || scope.includes(categorySlug);
}
