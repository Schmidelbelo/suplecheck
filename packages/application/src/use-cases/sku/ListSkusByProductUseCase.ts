import type { UseCase } from "../../shared/UseCase";
import type { PageResult } from "../../shared/Pagination";
import { defaultPageRequest } from "../../shared/Pagination";
import type { ListSkusByProductQuery } from "../../queries/CatalogQueries";
import type { SkuDTO } from "../../dto/SkuDTO";
import type { SkuRepositoryPort } from "../../ports/SkuRepositoryPort";
import { SkuMapper } from "../../mappers/SkuMapper";

export class ListSkusByProductUseCase implements UseCase<
  ListSkusByProductQuery,
  PageResult<SkuDTO>
> {
  constructor(private readonly skus: SkuRepositoryPort) {}

  async execute(query: ListSkusByProductQuery): Promise<PageResult<SkuDTO>> {
    const result = await this.skus.listByProduct(query.productId, defaultPageRequest(query.page));
    return { ...result, items: SkuMapper.toDTOList(result.items) };
  }
}
