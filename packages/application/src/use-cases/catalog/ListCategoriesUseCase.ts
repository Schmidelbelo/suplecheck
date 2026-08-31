import type { ParameterlessUseCase } from "../../shared/UseCase";
import type { CategoryDTO } from "../../dto/CatalogDTO";
import type { CategoryRepositoryPort } from "../../ports/CatalogRepositoryPort";

export class ListCategoriesUseCase implements ParameterlessUseCase<CategoryDTO[]> {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  async execute(): Promise<CategoryDTO[]> {
    const records = await this.categories.listAll();
    return records.map((record) => ({ ...record }));
  }
}
