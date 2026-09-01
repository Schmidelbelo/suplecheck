import type { UseCase } from "../../shared/UseCase";
import type {
  SetSupplementStatusCommand,
  DeleteSupplementCommand,
} from "../../commands/SupplementCommands";
import type { SupplementRepositoryPort } from "../../ports/SupplementRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { SupplementNotFoundError } from "../../errors/ApplicationError";

export class SetSupplementStatusUseCase implements UseCase<SetSupplementStatusCommand, void> {
  constructor(
    private readonly supplements: SupplementRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: SetSupplementStatusCommand): Promise<void> {
    const existing = await this.supplements.findById(command.id);
    if (!existing) throw new SupplementNotFoundError(command.id);

    await this.supplements.setStatus(command.id, command.status);
    await this.auditLog.record({
      actorId: "system",
      action: "supplement.status_changed",
      entityType: "supplement",
      entityId: command.id,
      metadata: { from: existing.status, to: command.status },
      occurredAt: this.clock.now(),
    });
  }
}

/** Soft delete — transiciona para ARCHIVED (Domain Model §3.1); nunca remove a linha. */
export class DeleteSupplementUseCase implements UseCase<DeleteSupplementCommand, void> {
  private readonly setStatus: SetSupplementStatusUseCase;

  constructor(supplements: SupplementRepositoryPort, clock: ClockPort, auditLog: AuditLogPort) {
    this.setStatus = new SetSupplementStatusUseCase(supplements, clock, auditLog);
  }

  async execute(command: DeleteSupplementCommand): Promise<void> {
    await this.setStatus.execute({ id: command.id, status: "ARCHIVED" });
  }
}
