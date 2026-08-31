import { CriterionId, CriterionStatus } from "../../domain-kernel";
import type { UseCase } from "../../shared/UseCase";
import type { SetCriterionStatusCommand } from "../../commands/MethodologyCommands";
import type { CriterionCatalogPort } from "../../ports/CriterionCatalogPort";
import type { MethodologyRepositoryPort } from "../../ports/MethodologyRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { MethodologyMapper } from "../../mappers/MethodologyMapper";
import { CriterionDeactivationPolicy } from "../../policies/CriterionDeactivationPolicy";
import { CriterionNotFoundError } from "../../errors/ApplicationError";

const STATUS_MAP: Record<SetCriterionStatusCommand["status"], CriterionStatus> = {
  ACTIVE: CriterionStatus.ACTIVE,
  DISABLED: CriterionStatus.DISABLED,
  DEPRECATED: CriterionStatus.DEPRECATED,
};

/**
 * Ativa, desativa ou deprecia um critério no catálogo.
 *
 * Limitação conhecida e deliberada: `CriterionDeactivationPolicy` (ver
 * arquivo próprio) só pode checar metodologias que o chamador informar —
 * `MethodologyRepositoryPort` ainda não tem uma consulta do tipo "quais
 * metodologias referenciam o critério X" (exigiria um índice reverso que
 * nenhum Port modela hoje). Por isso, quando `affectedMethodologyIds` é
 * omitido, a política simplesmente não é aplicada — o Domain ainda
 * protege o caso extremo no momento do cálculo (`NoActiveCriteriaError`).
 */
export class SetCriterionStatusUseCase implements UseCase<SetCriterionStatusCommand, void> {
  private readonly deactivationPolicy = new CriterionDeactivationPolicy();

  constructor(
    private readonly criteria: CriterionCatalogPort,
    private readonly methodologies: MethodologyRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(
    command: SetCriterionStatusCommand,
    affectedMethodologyIds: readonly string[] = [],
  ): Promise<void> {
    const all = await this.criteria.listAll();
    const exists = all.some((c) => c.metadata.id.value === command.criterionId);
    if (!exists) throw new CriterionNotFoundError(command.criterionId);

    if (command.status === "DISABLED" && affectedMethodologyIds.length > 0) {
      const dtos = await Promise.all(
        affectedMethodologyIds.map((id) => this.methodologies.findById(id)),
      );
      const methodologies = dtos
        .filter((dto): dto is NonNullable<typeof dto> => dto !== null)
        .map((dto) => MethodologyMapper.fromDTO(dto));
      this.deactivationPolicy.assertCanDeactivate(command.criterionId, methodologies);
    }

    await this.criteria.setStatus(CriterionId.of(command.criterionId), STATUS_MAP[command.status]);
    await this.auditLog.record({
      actorId: "system",
      action: "criterion.status_changed",
      entityType: "criterion",
      entityId: command.criterionId,
      metadata: { status: command.status },
      occurredAt: this.clock.now(),
    });
  }
}
