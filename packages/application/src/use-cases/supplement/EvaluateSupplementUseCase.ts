import type { UseCase } from "../../shared/UseCase";
import type { EvaluateSupplementCommand } from "../../commands/SupplementCommands";
import type { IndexResultDTO } from "../../dto/IndexResultDTO";
import type { SupplementRepositoryPort } from "../../ports/SupplementRepositoryPort";
import type { MethodologyRepositoryPort } from "../../ports/MethodologyRepositoryPort";
import type { IndexResultRepositoryPort } from "../../ports/IndexResultRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import type { AnalyticsPort } from "../../ports/AnalyticsPort";
import type { CriterionCatalogPort } from "../../ports/CriterionCatalogPort";
import { CalculateIndexUseCase } from "./CalculateIndexUseCase";
import { SupplementProfileFactory } from "../../factories/SupplementProfileFactory";
import { EvaluationContextFactory } from "../../factories/EvaluationContextFactory";
import { MethodologyMapper } from "../../mappers/MethodologyMapper";
import { EvaluateSupplementValidator } from "../../validators/SupplementValidators";
import {
  ValidationFailedError,
  SupplementNotFoundError,
  MethodologyNotFoundError,
} from "../../errors/ApplicationError";

/**
 * O caso de uso real de "avaliar um suplemento": carrega o suplemento e
 * a metodologia aplicável, monta o contexto de avaliação, delega o
 * cálculo a `CalculateIndexUseCase`, persiste o resultado e registra
 * auditoria + analytics. `CalculateIndexUseCase` é chamado por
 * composição — não por herança —, então pode ser testado/reusado
 * isoladamente (ex: um "recalcular em lote" que não precisa de todo o
 * resto desta orquestração).
 */
export class EvaluateSupplementUseCase implements UseCase<
  EvaluateSupplementCommand,
  IndexResultDTO
> {
  private readonly validator = new EvaluateSupplementValidator();
  private readonly calculateIndex: CalculateIndexUseCase;

  constructor(
    private readonly supplements: SupplementRepositoryPort,
    private readonly methodologies: MethodologyRepositoryPort,
    private readonly indexResults: IndexResultRepositoryPort,
    criterionCatalog: CriterionCatalogPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
    private readonly analytics: AnalyticsPort,
  ) {
    this.calculateIndex = new CalculateIndexUseCase(criterionCatalog);
  }

  async execute(command: EvaluateSupplementCommand): Promise<IndexResultDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const supplementRecord = await this.supplements.findById(command.supplementId);
    if (!supplementRecord) throw new SupplementNotFoundError(command.supplementId);

    const methodologyDTO = command.methodologyId
      ? await this.methodologies.findById(command.methodologyId)
      : await this.methodologies.findActiveForCategory(supplementRecord.categorySlug);
    if (!methodologyDTO) {
      throw new MethodologyNotFoundError(
        command.methodologyId ?? `ativa para "${supplementRecord.categorySlug}"`,
      );
    }

    const supplement = SupplementProfileFactory.fromRecord(supplementRecord);
    const methodology = MethodologyMapper.fromDTO(methodologyDTO);
    const context = EvaluationContextFactory.fromCommand(command);

    const resultDTO = await this.calculateIndex.execute({ supplement, methodology, context });

    await this.indexResults.save(resultDTO);

    const now = this.clock.now();
    await this.auditLog.record({
      actorId: "system",
      action: "supplement.evaluated",
      entityType: "supplement",
      entityId: supplementRecord.id,
      metadata: {
        methodologyId: resultDTO.methodologyId,
        methodologyVersion: resultDTO.methodologyVersion,
        finalScore: resultDTO.finalScore,
      },
      occurredAt: now,
    });
    await this.analytics.track({
      name: "index_calculated",
      properties: {
        supplementId: supplementRecord.id,
        categorySlug: supplementRecord.categorySlug,
        finalScore: resultDTO.finalScore,
        classificationTier: resultDTO.classificationTier,
      },
      occurredAt: now,
    });

    return resultDTO;
  }
}
