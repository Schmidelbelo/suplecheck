import type { UseCase } from "../../shared/UseCase";
import type { CompareSupplementsQuery } from "../../queries/CatalogQueries";
import type { ComparisonDTO } from "../../dto/RankingDTO";
import type { SupplementRepositoryPort } from "../../ports/SupplementRepositoryPort";
import type { IndexResultRepositoryPort } from "../../ports/IndexResultRepositoryPort";
import { IndexResultMapper } from "../../mappers/IndexResultMapper";
import { ValidationFailedError } from "../../errors/ApplicationError";

/**
 * Compara suplementos usando o último Índice já calculado de cada um —
 * não recalcula nada (isso é `CalculateIndexUseCase`). Suplementos sem
 * nenhuma avaliação prévia são omitidos do resultado, não causam erro —
 * comparar 3 produtos onde 1 nunca foi avaliado deve mostrar os outros 2,
 * não falhar tudo.
 */
export class CompareSupplementsUseCase implements UseCase<CompareSupplementsQuery, ComparisonDTO> {
  constructor(
    private readonly supplements: SupplementRepositoryPort,
    private readonly indexResults: IndexResultRepositoryPort,
  ) {}

  async execute(query: CompareSupplementsQuery): Promise<ComparisonDTO> {
    if (query.supplementIds.length < 2) {
      throw new ValidationFailedError([
        "supplementIds: são necessários ao menos 2 suplementos para comparar",
      ]);
    }

    const records = await this.supplements.findManyByIds(query.supplementIds);
    const categorySlug = records[0]?.categorySlug ?? "";

    const results = await Promise.all(
      query.supplementIds.map((id) => this.indexResults.findLatest(id)),
    );
    const items = results
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .map((result) => IndexResultMapper.summaryFromDTO(result));

    return { categorySlug, items };
  }
}
