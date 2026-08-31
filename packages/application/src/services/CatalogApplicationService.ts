import type { AllUseCases } from "../factories/UseCaseFactory";

export class CatalogApplicationService {
  constructor(private readonly useCases: Pick<AllUseCases, "listCategories" | "listBrands">) {}

  listCategories() {
    return this.useCases.listCategories.execute();
  }

  listBrands() {
    return this.useCases.listBrands.execute();
  }
}
