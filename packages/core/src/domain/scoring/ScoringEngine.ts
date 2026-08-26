import type { ResolvedMethodology } from "../methodology/MethodologyResolver";
import type { CriterionRegistry } from "../criteria/CriterionRegistry";
import type { EvaluationContext } from "../evaluation/EvaluationContext";
import { SupleCheckIndexResult, type CriterionBreakdownEntry } from "./SupleCheckIndexResult";
import type { WeightedScore } from "./AggregationStrategy";

/**
 * O motor de cálculo do Índice SupleCheck. Deliberadamente "burro": não
 * sabe o que é um critério específico, não sabe o que é uma categoria,
 * não sabe como pesos são decididos — apenas executa os critérios já
 * resolvidos por `MethodologyResolver`, agrega segundo a
 * `AggregationStrategy` da metodologia e classifica o resultado.
 *
 * Toda a "inteligência de negócio" vive nos critérios, na metodologia e
 * no sistema de classificação — nunca aqui. É isso que permite adicionar
 * critérios, metodologias ou formas de agregação sem tocar esta classe.
 */
export class ScoringEngine {
  constructor(private readonly registry: CriterionRegistry) {}

  calculate(
    supplementId: string,
    resolved: ResolvedMethodology,
    context: EvaluationContext,
  ): SupleCheckIndexResult {
    const breakdown: CriterionBreakdownEntry[] = resolved.criteria.map(
      ({ criterionId, weight }) => {
        const criterion = this.registry.get(criterionId);
        const result = criterion.evaluate(context);
        return {
          criterionId,
          score: result.score,
          weight,
          notes: result.notes,
          flags: result.flags,
        };
      },
    );

    const weightedScores: WeightedScore[] = breakdown.map((entry) => ({
      score: entry.score,
      weight: entry.weight,
    }));

    const finalScore = resolved.aggregation.aggregate(weightedScores);
    const classification = resolved.classification.classify(finalScore);

    return SupleCheckIndexResult.of({
      supplementId,
      categorySlug: resolved.categorySlug,
      methodologyId: resolved.methodologyId,
      methodologyVersion: resolved.version,
      finalScore,
      classification,
      breakdown,
    });
  }
}
