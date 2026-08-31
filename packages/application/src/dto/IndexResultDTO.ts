export interface TechnicalNoteDTO {
  readonly message: string;
  readonly evidenceQuality: string;
}

export interface ValidationFlagDTO {
  readonly code: string;
  readonly message: string;
  readonly severity: string;
}

export interface CriterionBreakdownDTO {
  readonly criterionId: string;
  readonly score: number;
  readonly weight: number;
  readonly notes: readonly TechnicalNoteDTO[];
  readonly flags: readonly ValidationFlagDTO[];
}

export interface IndexResultDTO {
  readonly supplementId: string;
  readonly categorySlug: string;
  readonly methodologyId: string;
  readonly methodologyVersion: string;
  readonly finalScore: number;
  readonly classificationTier: string;
  readonly classificationLabel: string;
  readonly breakdown: readonly CriterionBreakdownDTO[];
  readonly calculatedAt: string; // ISO 8601
}
