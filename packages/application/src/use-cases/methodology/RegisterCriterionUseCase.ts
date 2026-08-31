import { CriterionStatus } from "../../domain-kernel";
import type { UseCase } from "../../shared/UseCase";
import type { RegisterCriterionCommand } from "../../commands/MethodologyCommands";
import type { CriterionDTO } from "../../dto/CriterionDTO";
import type { CriterionCatalogPort } from "../../ports/CriterionCatalogPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { CriterionMapper } from "../../mappers/CriterionMapper";

/**
 * Registra a *disponibilidade* de um critério já implementado em código
 * (uma classe `Criterion` do Domain — simples ou `CompositeCriterion`)
 * no catálogo da plataforma. Não cria lógica nova: a lógica de cálculo
 * de um critério é sempre código, escrito e revisado como qualquer outra
 * mudança de Domain — este Use Case só a torna conhecida/selecionável
 * para compor metodologias. Ver ARCHITECTURE.md §5.
 */
export class RegisterCriterionUseCase implements UseCase<RegisterCriterionCommand, CriterionDTO> {
  constructor(
    private readonly criteria: CriterionCatalogPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: RegisterCriterionCommand): Promise<CriterionDTO> {
    await this.criteria.register(command.criterion);
    await this.auditLog.record({
      actorId: "system",
      action: "criterion.registered",
      entityType: "criterion",
      entityId: command.criterion.metadata.id.value,
      metadata: { kind: command.criterion.metadata.kind },
      occurredAt: this.clock.now(),
    });

    return CriterionMapper.toDTO(command.criterion, CriterionStatus.ACTIVE);
  }
}
