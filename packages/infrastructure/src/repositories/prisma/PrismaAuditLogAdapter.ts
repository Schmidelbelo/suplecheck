import type { PrismaClient } from "@prisma/client";
import type { AuditLogPort, AuditEntry } from "../../application-kernel";

/**
 * Implementação real de `AuditLogPort` sobre Prisma. `AuditLog.actorAdminId`
 * tem FK real para `AdminUser` — hoje todo Use Case grava `actorId: "system"`
 * (nenhum fluxo de autenticação admin implementado ainda), então mapeamos
 * isso para `actorType: SYSTEM` e `actorAdminId: null`. Se um `actorId` real
 * de admin passar a ser gravado no futuro, ele precisa corresponder a um
 * `AdminUser.id` existente, senão a FK rejeita a escrita.
 */
export class PrismaAuditLogAdapter implements AuditLogPort {
  constructor(private readonly client: PrismaClient) {}

  async record(entry: AuditEntry): Promise<void> {
    const isSystem = entry.actorId === "system";
    await this.client.auditLog.create({
      data: {
        actorType: isSystem ? "SYSTEM" : "ADMIN",
        actorAdminId: isSystem ? null : entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as object,
        createdAt: entry.occurredAt,
      },
    });
  }
}
