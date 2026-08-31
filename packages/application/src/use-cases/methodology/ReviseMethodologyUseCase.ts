import {
  CriterionAssignment,
  CriterionId,
  Weight,
  type ClassificationSystem,
} from "../../domain-kernel";
import type { UseCase } from "../../shared/UseCase";
import type { ReviseMethodologyCommand } from "../../commands/MethodologyCommands";
import type { MethodologyDTO } from "../../dto/MethodologyDTO";
import type { MethodologyRepositoryPort } from "../../ports/MethodologyRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { MethodologyMapper } from "../../mappers/MethodologyMapper";
import { MethodologyRevisionPolicy } from "../../policies/MethodologyRevisionPolicy";
import { MethodologyNotFoundError } from "../../errors/ApplicationError";

/**
 * Cria uma NOVA versão de uma metodologia existente — nunca sobrescreve
 * a anterior (`Methodology.revise()`, Domain, é imutável). A versão
 * anterior continua recuperável via
 * `MethodologyRepositoryPort.listVersions`, para que um
 * `SupleCheckIndexResult` antigo continue explicável contra a
 * metodologia exata que o gerou.
 */
export class ReviseMethodologyUseCase implements UseCase<ReviseMethodologyCommand, MethodologyDTO> {
  private readonly revisionPolicy = new MethodologyRevisionPolicy();

  constructor(
    private readonly methodologies: MethodologyRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: ReviseMethodologyCommand): Promise<MethodologyDTO> {
    const currentDTO = await this.methodologies.findById(command.methodologyId);
    if (!currentDTO) throw new MethodologyNotFoundError(command.methodologyId);

    const current = MethodologyMapper.fromDTO(currentDTO);

    // Só inclui as chaves que realmente mudam: `Methodology.revise` faz
    // `{ ...this.props, ...changes }` — incluir uma chave com valor
    // `undefined` a sobrescreveria por engano.
    const changes: { assignments?: CriterionAssignment[]; classification?: ClassificationSystem } =
      {};
    if (command.criteria) {
      changes.assignments = command.criteria.map((c) =>
        CriterionAssignment.of(
          CriterionId.of(c.criterionId),
          Weight.of(c.weight),
          c.enabled ?? true,
        ),
      );
    }
    if (command.classification) {
      changes.classification = MethodologyMapper.classificationFromDTO(command.classification);
    }

    const revised = current.revise(changes, command.bump);
    this.revisionPolicy.assertRevisionIsMeaningful(current, revised);

    const revisedDTO = MethodologyMapper.toDTO(revised, {
      classification: command.classification ?? currentDTO.classification,
      categoryOverrides: currentDTO.categoryOverrides,
    });

    await this.methodologies.save(revisedDTO);
    await this.auditLog.record({
      actorId: "system",
      action: "methodology.revised",
      entityType: "methodology",
      entityId: revisedDTO.id,
      metadata: { fromVersion: currentDTO.version, toVersion: revisedDTO.version },
      occurredAt: this.clock.now(),
    });

    return revisedDTO;
  }
}
