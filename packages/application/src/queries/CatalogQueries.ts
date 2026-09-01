import type { PageRequest } from "../shared/Pagination";
import type { SupplementSort } from "../ports/SupplementRepositoryPort";
import type { ReferenceDataSort } from "../ports/CatalogRepositoryPort";

export interface SearchSupplementsQuery {
  readonly categorySlug?: string;
  readonly brandSlug?: string;
  readonly search?: string;
  readonly page?: PageRequest;
  readonly sort?: SupplementSort;
  /** Uso administrativo — sem isso, a busca só retorna PUBLISHED (catálogo público). */
  readonly includeAllStatuses?: boolean;
}

export interface CompareSupplementsQuery {
  readonly supplementIds: readonly string[];
}

/** Consulta genérica reaproveitada por Categoria/Marca/Fabricante — os três têm exatamente a mesma forma de busca (Reference Data). */
export interface SearchReferenceDataQuery {
  readonly search?: string;
  readonly includeInactive?: boolean;
  readonly page?: PageRequest;
  readonly sort?: ReferenceDataSort;
}

export interface ListSkusByProductQuery {
  readonly productId: string;
  readonly page?: PageRequest;
}

export interface GetRankingQuery {
  readonly categorySlug: string;
}
