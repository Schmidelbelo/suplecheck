import type { UseCase } from "../../shared/UseCase";
import type { CreateMethodologyCommand } from "../../commands/MethodologyCommands";
import type { MethodologyDTO } from "../../dto/MethodologyDTO";
import type { MethodologyRepositoryPort } from "../../ports/MethodologyRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { MethodologyMapper } from "../../mappers/MethodologyMapper";
import { CreateMethodologyValidator } from "../../validators/MethodologyValidators";
import { ValidationFailedError } from "../../errors/ApplicationError";

export class CreateMethodologyUseCase implements UseCase<CreateMethodologyCommand, MethodologyDTO> {
  private readonly validator = new CreateMethodologyValidator();

  constructor(
    private readonly methodologies: MethodologyRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: CreateMethodologyCommand): Promise<MethodologyDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    // A validação de invariante real (soma de pesos = 1, sem critério
    // duplicado) acontece dentro de `Methodology.of`, chamada por
    // `MethodologyBuilder.build()` — se falhar, o `WeightSumMismatchError`
    // (Domain) propaga; quem chamar este Use Case deve tratá-lo como um
    // erro de negócio esperado, não uma falha do sistema.
    const methodology = MethodologyMapper.fromCreateCommand(command);
    const dto = MethodologyMapper.toDTO(methodology, {
      classification: command.classification,
      categoryOverrides: command.categoryOverrides,
    });

    await this.methodologies.save(dto);
    await this.auditLog.record({
      actorId: "system",
      action: "methodology.created",
      entityType: "methodology",
      entityId: dto.id,
      metadata: { version: dto.version, criteriaCount: dto.assignments.length },
      occurredAt: this.clock.now(),
    });

    return dto;
  }
}
