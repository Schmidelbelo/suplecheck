import type { Methodology } from "./Methodology";
import { WeightNormalizer, type WeightedCriterionRef } from "./WeightNormalizer";
import type { ClassificationSystem } from "../classification/ClassificationSystem";
import type { AggregationStrategy } from "../scoring/AggregationStrategy";
import type { MethodologyVersion } from "../value-objects/MethodologyVersion";
import { NoActiveCriteriaError } from "../errors/DomainError";

export interface ResolvedMethodology {
  readonly methodologyId: string;
  readonly version: MethodologyVersion;
  readonly categorySlug: string;
  readonly criteria: readonly WeightedCriterionRef[];
  readonly classification: ClassificationSystem;
  readonly aggregation: AggregationStrategy;
}

/**
 * Aplica, para uma categoria específica, as regras de uma `Methodology`
 * base + seu `CategoryOverride` (se existir) e devolve uma configuração
 * "achatada" e pronta para o `ScoringEngine` consumir. Este é o único
 * lugar do domínio onde "metodologia genérica" + "regra de categoria"
 * se encontram — o motor de cálculo nunca lida com overrides diretamente.
 */
export class MethodologyResolver {
  static resolve(methodology: Methodology, categorySlug: string): ResolvedMethodology {
    const override = methodology.overrideFor(categorySlug);

    const active = methodology.assignments
      .filter((assignment) => assignment.enabled)
      .filter((assignment) => !override?.disables(assignment.criterionId))
      .map((assignment) => ({
        criterionId: assignment.criterionId,
        weight: override?.weightOverrideFor(assignment.criterionId) ?? assignment.weight,
      }));

    if (active.length === 0) {
      throw new NoActiveCriteriaError(
        `metodologia "${methodology.id}", categoria "${categorySlug}"`,
      );
    }

    return {
      methodologyId: methodology.id,
      version: methodology.version,
      categorySlug,
      criteria: WeightNormalizer.normalize(active),
      classification: override?.classification ?? methodology.classification,
      aggregation: methodology.aggregation,
    };
  }
}
