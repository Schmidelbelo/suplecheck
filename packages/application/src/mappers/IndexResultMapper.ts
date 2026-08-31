import type { SupleCheckIndexResult } from "../domain-kernel";
import type { IndexResultDTO, CriterionBreakdownDTO } from "../dto/IndexResultDTO";
import type { IndexResultSummaryDTO } from "../dto/RankingDTO";

export const IndexResultMapper = {
  toDTO(result: SupleCheckIndexResult): IndexResultDTO {
    return {
      supplementId: result.supplementId,
      categorySlug: result.categorySlug,
      methodologyId: result.methodologyId,
      methodologyVersion: result.methodologyVersion.toString(),
      finalScore: result.finalScore.value,
      classificationTier: result.classification.tier,
      classificationLabel: result.classification.label,
      breakdown: result.breakdown.map((entry): CriterionBreakdownDTO => ({
        criterionId: entry.criterionId.value,
        score: entry.score.value,
        weight: entry.weight.value,
        notes: entry.notes.map((note) => ({
          message: note.message,
          evidenceQuality: note.evidenceQuality,
        })),
        flags: entry.flags.map((flag) => ({
          code: flag.code,
          message: flag.message,
          severity: flag.severity,
        })),
      })),
      calculatedAt: result.calculatedAt.toISOString(),
    };
  },

  toSummaryDTO(result: SupleCheckIndexResult): IndexResultSummaryDTO {
    return {
      supplementId: result.supplementId,
      finalScore: result.finalScore.value,
      classificationTier: result.classification.tier,
      classificationLabel: result.classification.label,
      criteriaScores: Object.fromEntries(
        result.breakdown.map((entry) => [entry.criterionId.value, entry.score.value]),
      ),
    };
  },

  /** Mesma forma que `toSummaryDTO`, mas partindo de um `IndexResultDTO` já persistido (ex: lido de `IndexResultRepositoryPort`), sem envolver nenhum tipo de Domain. */
  summaryFromDTO(dto: IndexResultDTO): IndexResultSummaryDTO {
    return {
      supplementId: dto.supplementId,
      finalScore: dto.finalScore,
      classificationTier: dto.classificationTier,
      classificationLabel: dto.classificationLabel,
      criteriaScores: Object.fromEntries(
        dto.breakdown.map((entry) => [entry.criterionId, entry.score]),
      ),
    };
  },
};
