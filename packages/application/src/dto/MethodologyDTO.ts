export interface CriterionAssignmentDTO {
  readonly criterionId: string;
  readonly weight: number; // fração 0–1
  readonly enabled: boolean;
}

export interface ClassificationBandDTO {
  readonly tier: string;
  readonly minScore: number;
  readonly label: string;
  readonly description: string;
}

export interface CategoryOverrideDTO {
  readonly categorySlug: string;
  readonly disabledCriteria: readonly string[];
  readonly weightOverrides: Readonly<Record<string, number>>;
  readonly classification?: readonly ClassificationBandDTO[];
}

export interface MethodologyDTO {
  readonly id: string;
  readonly name: string;
  readonly version: string; // "1.2.0"
  readonly aggregationStrategyName: string;
  readonly assignments: readonly CriterionAssignmentDTO[];
  readonly classification: readonly ClassificationBandDTO[];
  readonly categoryOverrides: readonly CategoryOverrideDTO[];
}
