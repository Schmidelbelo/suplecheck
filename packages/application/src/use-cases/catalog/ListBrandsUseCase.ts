import type { ParameterlessUseCase } from "../../shared/UseCase";
import type { BrandDTO } from "../../dto/CatalogDTO";
import type { BrandRepositoryPort } from "../../ports/CatalogRepositoryPort";
import { BrandMapper } from "../../mappers/CatalogMapper";

export class ListBrandsUseCase implements ParameterlessUseCase<BrandDTO[]> {
  constructor(private readonly brands: BrandRepositoryPort) {}

  async execute(): Promise<BrandDTO[]> {
    const records = await this.brands.listAll();
    return BrandMapper.toDTOList(records);
  }
}
