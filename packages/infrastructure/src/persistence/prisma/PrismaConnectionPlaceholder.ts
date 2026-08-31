/**
 * Placeholder deliberado — NÃO importa `@prisma/client`, não abre
 * nenhuma conexão. Existe só para documentar o formato que a conexão
 * Prisma vai assumir quando for ligada, e para que
 * `bootstrap/InfrastructureContainer.ts` já tenha o branch pronto
 * (`if (config.database.url) { ... }`) sem precisar ser reescrito depois.
 *
 * Quando a etapa de conectar o Prisma acontecer, este arquivo vira:
 *   import { PrismaClient } from "@prisma/client";
 *   export class PrismaConnection implements PersistenceProvider {
 *     private readonly client = new PrismaClient();
 *     ...
 *   }
 * — e cada `Prisma*RepositoryStub` em `repositories/` ganha implementação
 * real usando `this.client`.
 */
import type { PersistenceProvider } from "../PersistenceProvider";
import { InfrastructureNotConfiguredError } from "../../errors/InfrastructureError";

export class PrismaConnectionPlaceholder implements PersistenceProvider {
  readonly name = "prisma (não conectado)";

  async connect(): Promise<void> {
    throw new InfrastructureNotConfiguredError(
      "Prisma",
      "DATABASE_URL está definida, mas o adapter Prisma ainda não foi implementado — só o placeholder existe.",
    );
  }

  async disconnect(): Promise<void> {
    // Nada a desconectar — nunca conectou.
  }

  async isHealthy(): Promise<boolean> {
    return false;
  }
}
