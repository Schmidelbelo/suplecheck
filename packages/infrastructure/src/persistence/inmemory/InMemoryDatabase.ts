import type { PersistenceProvider } from "../PersistenceProvider";

/**
 * "Banco" in-memory compartilhado pelos repositórios em
 * `repositories/*`. Cada repositório recebe (ou cria) uma `Map` própria
 * a partir daqui — isso simula o que um `PrismaClient` real ofereceria
 * (uma única fonte de conexão/estado compartilhada entre repositórios)
 * sem depender de nenhum banco de verdade. Dados somem quando o
 * processo termina — comportamento correto e esperado para este adapter.
 */
export class InMemoryDatabase implements PersistenceProvider {
  readonly name = "in-memory";
  private readonly tables = new Map<string, Map<string, unknown>>();
  private readonly lists = new Map<string, unknown[]>();

  /** Para entidades com identidade (busca por id/slug) — a maioria dos repositórios. */
  table<T>(name: string): Map<string, T> {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Map());
    }
    return this.tables.get(name) as Map<string, T>;
  }

  /** Para dados append-only sem identidade própria (ex: trilha de auditoria, fila). */
  list<T>(name: string): T[] {
    if (!this.lists.has(name)) {
      this.lists.set(name, []);
    }
    return this.lists.get(name) as T[];
  }

  async connect(): Promise<void> {
    // Nada a fazer — o estado já existe em memória assim que a instância é criada.
  }

  async disconnect(): Promise<void> {
    this.tables.clear();
    this.lists.clear();
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
