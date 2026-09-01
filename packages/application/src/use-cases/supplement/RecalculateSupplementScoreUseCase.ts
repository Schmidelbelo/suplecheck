import type { UseCase } from "../../shared/UseCase";
import type { EvaluateSupplementCommand } from "../../commands/SupplementCommands";
import type { IndexResultDTO } from "../../dto/IndexResultDTO";
import type { IndexResultRepositoryPort } from "../../ports/IndexResultRepositoryPort";
import type { EvaluateSupplementUseCase } from "./EvaluateSupplementUseCase";
import { IndexResultNotFoundError } from "../../errors/ApplicationError";

/**
 * Recalcula o Índice de um suplemento já avaliado antes — mesma mecânica
 * de `EvaluateSupplementUseCase` (o cálculo é sempre do zero, nunca um
 * ajuste incremental sobre a nota anterior), mas só faz sentido chamar
 * isto quando já existe um resultado anterior: sem isso, o cliente devia
 * ter usado `evaluateSupplement` (o "calcular" inicial). A nova nota vira
 * uma linha nova no histórico — a anterior nunca é sobrescrita
 * (`ProductScore` é append-only, Data Pipeline §4.5).
 */
export class RecalculateSupplementScoreUseCase implements UseCase<
  EvaluateSupplementCommand,
  IndexResultDTO
> {
  constructor(
    private readonly indexResults: IndexResultRepositoryPort,
    private readonly evaluate: EvaluateSupplementUseCase,
  ) {}

  async execute(command: EvaluateSupplementCommand): Promise<IndexResultDTO> {
    const previous = await this.indexResults.findLatest(command.supplementId);
    if (!previous) throw new IndexResultNotFoundError(command.supplementId);

    return this.evaluate.execute(command);
  }
}
