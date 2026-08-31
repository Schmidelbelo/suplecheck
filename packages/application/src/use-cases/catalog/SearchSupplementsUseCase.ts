import type { UseCase } from "../../shared/UseCase";
import type { SearchSupplementsQuery } from "../../queries/CatalogQueries";
import type { PageResult } from "../../shared/Pagination";
import { defaultPageRequest } from "../../shared/Pagination";
import type { SupplementDTO } from "../../dto/SupplementDTO";
import type { SupplementRepositoryPort } from "../../ports/SupplementRepositoryPort";
import { SupplementMapper } from "../../mappers/SupplementMapper";

export class SearchSupplementsUseCase implements UseCase<
  SearchSupplementsQuery,
  PageResult<SupplementDTO>
> {
  constructor(private readonly supplements: SupplementRepositoryPort) {}

  async execute(query: SearchSupplementsQuery): Promise<PageResult<SupplementDTO>> {
    const page = defaultPageRequest(query.page);
    const result = await this.supplements.search(
      { categorySlug: query.categorySlug, brandSlug: query.brandSlug, search: query.search },
      page,
    );

    return {
      items: SupplementMapper.toDTOList(result.items),
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages,
    };
  }
}
