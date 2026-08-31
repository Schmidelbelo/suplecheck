import type { TransactionManager } from "./TransactionManager";

/**
 * Implementação real, mas sem isolamento de verdade — `InMemoryDatabase`
 * não tem conceito de rollback, então "rodar em transação" aqui é só
 * "rodar", e se `work()` lançar, os efeitos já aplicados NÃO são
 * desfeitos. Documentado deliberadamente: esta é a limitação honesta do
 * adapter in-memory, não um bug escondido.
 */
export class InMemoryTransactionManager implements TransactionManager {
  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
