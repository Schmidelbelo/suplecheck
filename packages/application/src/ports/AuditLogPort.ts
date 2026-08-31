export interface AuditEntry {
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

/**
 * Trilha de auditoria administrativa (quem fez o quê, quando). Escrita
 * imutável — nunca lida pelo fluxo normal da aplicação, só por quem
 * investiga um incidente ou uma disputa.
 */
export interface AuditLogPort {
  record(entry: AuditEntry): Promise<void>;
}
