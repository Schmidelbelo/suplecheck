/**
 * Executa uma função dentro de uma transação — nenhum Use Case da
 * Application conhece isto diretamente (Application não sabe o que é
 * uma transação de banco); é consumido por Infrastructure quando um
 * fluxo precisa de atomicidade entre múltiplos repositórios (ex: salvar
 * `SupleCheckIndexResult` + atualizar o ranking agregado em uma única
 * escrita atômica, quando ambos forem Prisma).
 */
export interface TransactionManager {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
