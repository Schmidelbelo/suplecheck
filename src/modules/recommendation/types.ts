import type { PersonalizedWeights, RecommendationEntry } from "@core/index";

export interface RecommendationApiResponse {
  readonly categorySlug: string;
  readonly weightsUsed: PersonalizedWeights;
  readonly ranking: readonly RecommendationEntry[];
  readonly recommended: RecommendationEntry | null;
  readonly runnerUp: RecommendationEntry | null;
  readonly cheapest: RecommendationEntry | null;
  readonly comparisonNarrative: readonly string[];
}
