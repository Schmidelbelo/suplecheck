import type { PageRequest, PageResult } from "../shared/Pagination";

export type ProductStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";

/**
 * Forma de persistência de um suplemento, de propriedade da Application
 * Layer (não é o Domain `SupplementProfile`, nem uma tabela do Prisma —
 * é o contrato que qualquer adapter de infraestrutura deve satisfazer).
 */
export interface SupplementRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly categorySlug: string;
  readonly brandSlug: string;
  readonly manufacturerSlug?: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly status: ProductStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplementSearchCriteria {
  readonly categorySlug?: string;
  readonly brandSlug?: string;
  readonly search?: string;
  readonly status?: ProductStatus;
}

export type SupplementSort = "name-asc" | "name-desc" | "recent";

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
    sort?: SupplementSort,
  ): Promise<PageResult<SupplementRecord>>;
  save(record: SupplementRecord): Promise<void>;
  /** Soft delete — transiciona para ARCHIVED (Domain Model §3.1), nunca remove a linha. */
  setStatus(id: string, status: ProductStatus): Promise<void>;
}
