import type { UseCase } from "../../shared/UseCase";
import type { UpdateSupplementCommand } from "../../commands/SupplementCommands";
import type { SupplementDTO } from "../../dto/SupplementDTO";
import type {
  SupplementRepositoryPort,
  SupplementRecord,
} from "../../ports/SupplementRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { SupplementMapper } from "../../mappers/SupplementMapper";
import { SupplementNotFoundError, ValidationFailedError } from "../../errors/ApplicationError";

export class UpdateSupplementUseCase implements UseCase<UpdateSupplementCommand, SupplementDTO> {
  constructor(
    private readonly supplements: SupplementRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: UpdateSupplementCommand): Promise<SupplementDTO> {
    if (command.name !== undefined && command.name.trim().length < 2) {
      throw new ValidationFailedError(["name: deve ter ao menos 2 caracteres"]);
    }

    const existing = await this.supplements.findById(command.id);
    if (!existing) throw new SupplementNotFoundError(command.id);

    const now = this.clock.now();
    const updated: SupplementRecord = {
      ...existing,
      name: command.name ?? existing.name,
      description: command.description ?? existing.description,
      manufacturerSlug: command.manufacturerSlug ?? existing.manufacturerSlug,
      attributes: command.attributes ?? existing.attributes,
      updatedAt: now,
    };

    await this.supplements.save(updated);
    await this.auditLog.record({
      actorId: "system",
      action: "supplement.updated",
      entityType: "supplement",
      entityId: updated.id,
      metadata: { fields: Object.keys(command).filter((k) => k !== "id") },
      occurredAt: now,
    });

    return SupplementMapper.toDTO(updated);
  }
}
