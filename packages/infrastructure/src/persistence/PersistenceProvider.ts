/**
 * Ciclo de vida de uma fonte de persistência (conectar/desconectar/
 * checar saúde) — implementado tanto por `InMemoryDatabase` (hoje)
 * quanto, no futuro, por um wrapper do `PrismaClient`. Repositories não
 * dependem disto diretamente; é consumido pelo bootstrap (para abrir/
 * fechar conexão) e por `monitoring/` (para checar saúde).
 */
export interface PersistenceProvider {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isHealthy(): Promise<boolean>;
}
