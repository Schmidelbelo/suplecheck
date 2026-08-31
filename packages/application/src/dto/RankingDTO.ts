export interface RankingEntryDTO {
  readonly position: number;
  readonly supplementId: string;
  readonly finalScore: number;
  readonly classificationTier: string;
}

export interface RankingDTO {
  readonly categorySlug: string;
  readonly methodologyId: string;
  readonly methodologyVersion: string;
  readonly generatedAt: string; // ISO 8601
  readonly entries: readonly RankingEntryDTO[];
}

export interface ComparisonDTO {
  readonly categorySlug: string;
  readonly items: readonly IndexResultSummaryDTO[];
}

/** Recorte enxuto de `IndexResultDTO` — o comparador não precisa do breakdown completo de notas técnicas por item. */
export interface IndexResultSummaryDTO {
  readonly supplementId: string;
  readonly finalScore: number;
  readonly classificationTier: string;
  readonly classificationLabel: string;
  readonly criteriaScores: Readonly<Record<string, number>>;
}
