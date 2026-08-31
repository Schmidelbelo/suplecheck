import type { PageRequest, PageResult } from "../shared/Pagination";

/**
 * Forma de persistência de um suplemento, de propriedade da Application
 * Layer (não é o Domain `SupplementProfile`, nem uma tabela do Prisma —
 * é o contrato que qualquer adapter de infraestrutura deve satisfazer).
 */
export interface SupplementRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly categorySlug: string;
  readonly brandSlug: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplementSearchCriteria {
  readonly categorySlug?: string;
  readonly brandSlug?: string;
  readonly search?: string;
}

/**
 * Port de persistência de suplementos. Implementado futuramente por um
 * adapter de Infrastructure (ex: um repositório Prisma) — a Application
 * Layer só conhece esta interface.
 */
export interface SupplementRepositoryPort {
  findById(id: string): Promise<SupplementRecord | null>;
  findBySlug(slug: string): Promise<SupplementRecord | null>;
  findManyByIds(ids: readonly string[]): Promise<SupplementRecord[]>;
  search(
    criteria: SupplementSearchCriteria,
    page: PageRequest,
  ): Promise<PageResult<SupplementRecord>>;
  save(record: SupplementRecord): Promise<void>;
}
