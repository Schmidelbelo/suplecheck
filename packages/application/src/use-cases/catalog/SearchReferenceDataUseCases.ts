import type { UseCase } from "../../shared/UseCase";
import type { PageResult } from "../../shared/Pagination";
import { defaultPageRequest } from "../../shared/Pagination";
import type { SearchReferenceDataQuery } from "../../queries/CatalogQueries";
import type { CategoryDTO, BrandDTO, ManufacturerDTO } from "../../dto/CatalogDTO";
import type {
  CategoryRepositoryPort,
  BrandRepositoryPort,
  ManufacturerRepositoryPort,
} from "../../ports/CatalogRepositoryPort";
import { CategoryMapper, BrandMapper, ManufacturerMapper } from "../../mappers/CatalogMapper";

function toCriteria(query: SearchReferenceDataQuery) {
  return { search: query.search, includeInactive: query.includeInactive };
}

export class SearchCategoriesUseCase implements UseCase<
  SearchReferenceDataQuery,
  PageResult<CategoryDTO>
> {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  async execute(query: SearchReferenceDataQuery): Promise<PageResult<CategoryDTO>> {
    const result = await this.categories.search(
      toCriteria(query),
      defaultPageRequest(query.page),
      query.sort,
    );
    return { ...result, items: CategoryMapper.toDTOList(result.items) };
  }
}

export class SearchBrandsUseCase implements UseCase<
  SearchReferenceDataQuery,
  PageResult<BrandDTO>
> {
  constructor(private readonly brands: BrandRepositoryPort) {}

  async execute(query: SearchReferenceDataQuery): Promise<PageResult<BrandDTO>> {
    const result = await this.brands.search(
      toCriteria(query),
      defaultPageRequest(query.page),
      query.sort,
    );
    return { ...result, items: BrandMapper.toDTOList(result.items) };
  }
}

export class SearchManufacturersUseCase implements UseCase<
  SearchReferenceDataQuery,
  PageResult<ManufacturerDTO>
> {
  constructor(private readonly manufacturers: ManufacturerRepositoryPort) {}

  async execute(query: SearchReferenceDataQuery): Promise<PageResult<ManufacturerDTO>> {
    const result = await this.manufacturers.search(
      toCriteria(query),
      defaultPageRequest(query.page),
      query.sort,
    );
    return { ...result, items: ManufacturerMapper.toDTOList(result.items) };
  }
}
