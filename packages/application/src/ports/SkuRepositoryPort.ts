import type { PageRequest, PageResult } from "../shared/Pagination";

export type SkuStatus = "ACTIVE" | "DISCONTINUED";

export interface SkuRecord {
  readonly id: string;
  readonly productId: string;
  readonly gtin?: string;
  readonly variantLabel: string;
  readonly servingsPerUnit?: number;
  readonly dosagePerServing?: number;
  readonly status: SkuStatus;
  readonly successorSkuId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Port de persistência de SKUs — a variação comercializável de um
 * Suplemento (Domain Model §3.1). Sempre escopado a um `productId`;
 * não existe "listar todos os SKUs da plataforma" sem filtro.
 */
export interface SkuRepositoryPort {
  findById(id: string): Promise<SkuRecord | null>;
  findByGtin(gtin: string): Promise<SkuRecord | null>;
  listByProduct(productId: string, page: PageRequest): Promise<PageResult<SkuRecord>>;
  save(record: SkuRecord): Promise<void>;
  /** Soft delete — transiciona para DISCONTINUED (Data Pipeline §4.3), nunca remove a linha. */
  setStatus(id: string, status: SkuStatus): Promise<void>;
}
