import type { ClassificationSystem } from "../../domain/classification/ClassificationSystem";
import type { AggregationStrategy } from "../../domain/scoring/AggregationStrategy";
import type { CategoryOverride } from "../../domain/methodology/CategoryOverride";

export interface CreateMethodologyCriterionSpec {
  readonly criterionId: string;
  readonly weight: number;
  readonly enabled?: boolean;
}

export interface CreateMethodologySpec {
  readonly id: string;
  readonly name: string;
  readonly criteria: readonly CreateMethodologyCriterionSpec[];
  readonly classification?: ClassificationSystem;
  readonly aggregation?: AggregationStrategy;
  readonly categoryOverrides?: readonly CategoryOverride[];
  /** Se true, redistribui os pesos informados para somar 1 em vez de exigir que já somem. */
  readonly normalizeWeights?: boolean;
}
