import { PrismaClient } from "@prisma/client";
import type { PersistenceProvider } from "../PersistenceProvider";

/**
 * Conexão real com o banco via Prisma — substitui o antigo
 * `PrismaConnectionPlaceholder` agora que esta etapa conecta o Prisma
 * de fato (ver `docs/domain-model/PERSISTENCE_MODEL.md` para o schema;
 * `provider = "sqlite"` em desenvolvimento local, `postgresql` em
 * produção — troca de uma linha, nenhum model muda).
 *
 * Uma única instância de `PrismaClient` por processo — reaproveitada
 * por todos os repositórios Prisma (`repositories/prisma/*`), nunca uma
 * instância nova por repositório (esgotaria o pool de conexões em
 * produção).
 */
export class PrismaConnection implements PersistenceProvider {
  readonly name = "prisma";
  readonly client: PrismaClient;

  constructor(databaseUrl: string) {
    this.client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  }

  async connect(): Promise<void> {
    await this.client.$connect();
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
