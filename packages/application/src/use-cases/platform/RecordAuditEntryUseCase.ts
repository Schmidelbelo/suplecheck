import type { UseCase } from "../../shared/UseCase";
import type { RecordAuditEntryCommand } from "../../commands/PlatformCommands";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import type { ClockPort } from "../../ports/SystemPorts";

/**
 * Porta de entrada explícita para registrar auditoria a partir de fora
 * desta camada (ex: uma ação administrativa que não passa por nenhum
 * outro Use Case de escrita). Os demais Use Cases de escrita já chamam
 * `AuditLogPort` diretamente — este existe para o caso em que o próprio
 * ato de auditar É a operação completa.
 */
export class RecordAuditEntryUseCase implements UseCase<RecordAuditEntryCommand, void> {
  constructor(
    private readonly auditLog: AuditLogPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: RecordAuditEntryCommand): Promise<void> {
    await this.auditLog.record({
      actorId: command.actorId,
      action: command.action,
      entityType: command.entityType,
      entityId: command.entityId,
      metadata: command.metadata ?? {},
      occurredAt: this.clock.now(),
    });
  }
}
