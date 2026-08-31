import type { IndexResultDTO } from "../dto/IndexResultDTO";
import type { RankingDTO, RankingEntryDTO } from "../dto/RankingDTO";

export const RankingMapper = {
  /** Ordena resultados por nota final (desc) e monta o snapshot de ranking. Opera só sobre DTOs — nenhum tipo de Domain envolvido. */
  build(
    categorySlug: string,
    methodologyId: string,
    methodologyVersion: string,
    results: readonly IndexResultDTO[],
    generatedAt: Date,
  ): RankingDTO {
    const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);

    const entries: RankingEntryDTO[] = sorted.map((result, index) => ({
      position: index + 1,
      supplementId: result.supplementId,
      finalScore: result.finalScore,
      classificationTier: result.classificationTier,
    }));

    return {
      categorySlug,
      methodologyId,
      methodologyVersion,
      generatedAt: generatedAt.toISOString(),
      entries,
    };
  },
};
