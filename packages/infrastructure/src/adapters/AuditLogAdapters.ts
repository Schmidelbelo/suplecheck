import type { AuditLogPort, AuditEntry } from "../application-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";
import type { Logger } from "../logging/Logger";

/** Implementação real: guarda a trilha de auditoria em memória, append-only. */
export class InMemoryAuditLogAdapter implements AuditLogPort {
  private readonly entries: AuditEntry[];

  constructor(db: InMemoryDatabase) {
    this.entries = db.list<AuditEntry>("audit_log");
  }

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  all(): readonly AuditEntry[] {
    return this.entries;
  }
}

/** Alternativa que só loga (útil em ambientes onde a trilha de auditoria vai para um coletor de logs externo, não para o banco da aplicação). */
export class ConsoleAuditLogAdapter implements AuditLogPort {
  constructor(private readonly logger: Logger) {}

  async record(entry: AuditEntry): Promise<void> {
    this.logger.info(`audit: ${entry.action}`, {
      actorId: entry.actorId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
    });
  }
}
