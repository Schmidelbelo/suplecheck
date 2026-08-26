import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "./Criterion";
import { CriterionKind } from "../enums/EvidenceQuality";
import type { Weight } from "../value-objects/Weight";
import { WeightSumMismatchError } from "../errors/DomainError";
import {
  WeightedAverageAggregationStrategy,
  type AggregationStrategy,
} from "../scoring/AggregationStrategy";
import type { EvaluationContext } from "../evaluation/EvaluationContext";

export interface CompositeChild {
  readonly criterion: Criterion;
  readonly weight: Weight;
}

/**
 * Um critério cuja nota é derivada da combinação de outros critérios
 * (ex: "Transparência do rótulo" = combinação de "ausência de mistura
 * proprietária" + "informação nutricional completa"). Implementa a mesma
 * interface `Criterion` que um critério simples (Composite Pattern), então
 * o `ScoringEngine` e o `CriterionRegistry` não distinguem os dois casos.
 */
export class CompositeCriterion implements Criterion {
  private constructor(
    readonly metadata: CriterionMetadata,
    private readonly children: readonly CompositeChild[],
    private readonly aggregation: AggregationStrategy,
  ) {}

  static of(
    metadata: Omit<CriterionMetadata, "kind">,
    children: readonly CompositeChild[],
    aggregation: AggregationStrategy = new WeightedAverageAggregationStrategy(),
  ): CompositeCriterion {
    if (children.length === 0) {
      throw new Error(`Critério composto "${metadata.id}" precisa de ao menos um critério filho.`);
    }
    const sum = children.reduce((total, child) => total + child.weight.value, 0);
    if (Math.abs(sum - 1) > 1e-6) {
      throw new WeightSumMismatchError(sum, `critério composto "${metadata.id}"`);
    }
    return new CompositeCriterion(
      { ...metadata, kind: CriterionKind.COMPOSITE },
      children,
      aggregation,
    );
  }

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const childResults = this.children.map((child) => ({
      result: child.criterion.evaluate(context),
      weight: child.weight,
    }));

    const score = this.aggregation.aggregate(
      childResults.map(({ result, weight }) => ({ score: result.score, weight })),
    );

    return {
      criterionId: this.metadata.id,
      score,
      notes: childResults.flatMap(({ result }) => result.notes),
      flags: childResults.flatMap(({ result }) => result.flags),
    };
  }
}
