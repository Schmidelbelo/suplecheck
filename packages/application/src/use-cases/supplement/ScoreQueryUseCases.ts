import type { UseCase } from "../../shared/UseCase";
import type { IndexResultDTO } from "../../dto/IndexResultDTO";
import type { IndexResultRepositoryPort } from "../../ports/IndexResultRepositoryPort";
import { IndexResultNotFoundError } from "../../errors/ApplicationError";

/** Leitura pura do Índice mais recente de um suplemento — "consultar score de um produto". */
export class GetSupplementScoreUseCase implements UseCase<string, IndexResultDTO> {
  constructor(private readonly indexResults: IndexResultRepositoryPort) {}

  async execute(supplementId: string): Promise<IndexResultDTO> {
    const result = await this.indexResults.findLatest(supplementId);
    if (!result) throw new IndexResultNotFoundError(supplementId);
    return result;
  }
}

/** Histórico completo de avaliações de um suplemento, mais recente primeiro — base do gráfico de evolução do Índice. */
export class ListSupplementScoreHistoryUseCase implements UseCase<
  string,
  readonly IndexResultDTO[]
> {
  constructor(private readonly indexResults: IndexResultRepositoryPort) {}

  async execute(supplementId: string): Promise<readonly IndexResultDTO[]> {
    return this.indexResults.listHistory(supplementId);
  }
}
