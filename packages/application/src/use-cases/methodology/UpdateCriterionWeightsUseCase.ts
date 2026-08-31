import type { UseCase } from "../../shared/UseCase";
import type { UpdateCriterionWeightsCommand } from "../../commands/MethodologyCommands";
import type { MethodologyDTO } from "../../dto/MethodologyDTO";
import type { MethodologyRepositoryPort } from "../../ports/MethodologyRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { ReviseMethodologyUseCase } from "./ReviseMethodologyUseCase";
import { MethodologyNotFoundError } from "../../errors/ApplicationError";

/**
 * "Gerenciar pesos" é, na prática, um caso particular de revisão de
 * metodologia (nova versão, pesos diferentes, mesmos critérios) — por
 * isso delega a `ReviseMethodologyUseCase` em vez de duplicar a lógica
 * de versionamento/persistência/auditoria.
 */
export class UpdateCriterionWeightsUseCase implements UseCase<
  UpdateCriterionWeightsCommand,
  MethodologyDTO
> {
  private readonly reviseMethodology: ReviseMethodologyUseCase;

  constructor(
    private readonly methodologies: MethodologyRepositoryPort,
    clock: ClockPort,
    auditLog: AuditLogPort,
  ) {
    this.reviseMethodology = new ReviseMethodologyUseCase(methodologies, clock, auditLog);
  }

  async execute(command: UpdateCriterionWeightsCommand): Promise<MethodologyDTO> {
    const currentDTO = await this.methodologies.findById(command.methodologyId);
    if (!currentDTO) throw new MethodologyNotFoundError(command.methodologyId);

    const weightByCriterion = new Map(command.weights.map((w) => [w.criterionId, w.weight]));
    const nextCriteria = currentDTO.assignments.map((assignment) => ({
      criterionId: assignment.criterionId,
      weight: weightByCriterion.get(assignment.criterionId) ?? assignment.weight,
      enabled: assignment.enabled,
    }));

    return this.reviseMethodology.execute({
      methodologyId: command.methodologyId,
      bump: command.bump ?? "patch",
      criteria: nextCriteria,
    });
  }
}
