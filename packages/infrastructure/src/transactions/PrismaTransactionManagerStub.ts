import type { TransactionManager } from "./TransactionManager";
import { ProviderNotImplementedError } from "../errors/InfrastructureError";

/** Stub — a versão real usa `PrismaClient.$transaction(work)`. */
export class PrismaTransactionManagerStub implements TransactionManager {
  async runInTransaction<T>(_work: () => Promise<T>): Promise<T> {
    throw new ProviderNotImplementedError("Prisma $transaction");
  }
}
