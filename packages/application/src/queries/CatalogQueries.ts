import type { PageRequest } from "../shared/Pagination";

export interface SearchSupplementsQuery {
  readonly categorySlug?: string;
  readonly brandSlug?: string;
  readonly search?: string;
  readonly page?: PageRequest;
}

export interface CompareSupplementsQuery {
  readonly supplementIds: readonly string[];
}

// ListCategoriesQuery e ListBrandsQuery não têm filtros hoje — parâmetros
// vazios `{}` seriam ruído. Os Use Cases correspondentes são
// `ParameterlessUseCase`. Ver `use-cases/catalog/ListCategoriesUseCase.ts`.

export interface GetRankingQuery {
  readonly categorySlug: string;
}
