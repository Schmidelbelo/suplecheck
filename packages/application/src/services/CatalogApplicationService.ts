import type { AllUseCases } from "../factories/UseCaseFactory";
import type {
  CreateCategoryCommand,
  UpdateCategoryCommand,
  CreateBrandCommand,
  UpdateBrandCommand,
  CreateManufacturerCommand,
  UpdateManufacturerCommand,
} from "../commands/CatalogCommands";
import type { SearchReferenceDataQuery } from "../queries/CatalogQueries";

const CATEGORY_KEYS = [
  "createCategory",
  "updateCategory",
  "setCategoryActive",
  "getCategory",
  "searchCategories",
  "listCategories",
] as const;
const BRAND_KEYS = [
  "createBrand",
  "updateBrand",
  "setBrandActive",
  "getBrand",
  "searchBrands",
  "listBrands",
] as const;
const MANUFACTURER_KEYS = [
  "createManufacturer",
  "updateManufacturer",
  "setManufacturerActive",
  "getManufacturer",
  "searchManufacturers",
] as const;

/** Fachada de todo o "dado de referência" do catálogo — Categoria, Marca, Fabricante. */
export class CatalogApplicationService {
  constructor(
    private readonly useCases: Pick<
      AllUseCases,
      | (typeof CATEGORY_KEYS)[number]
      | (typeof BRAND_KEYS)[number]
      | (typeof MANUFACTURER_KEYS)[number]
    >,
  ) {}

  // Categoria
  createCategory(command: CreateCategoryCommand) {
    return this.useCases.createCategory.execute(command);
  }
  updateCategory(command: UpdateCategoryCommand) {
    return this.useCases.updateCategory.execute(command);
  }
  setCategoryActive(id: string, active: boolean) {
    return this.useCases.setCategoryActive.execute({ id, active });
  }
  getCategory(idOrSlug: string) {
    return this.useCases.getCategory.execute(idOrSlug);
  }
  searchCategories(query: SearchReferenceDataQuery) {
    return this.useCases.searchCategories.execute(query);
  }
  listCategories() {
    return this.useCases.listCategories.execute();
  }

  // Marca
  createBrand(command: CreateBrandCommand) {
    return this.useCases.createBrand.execute(command);
  }
  updateBrand(command: UpdateBrandCommand) {
    return this.useCases.updateBrand.execute(command);
  }
  setBrandActive(id: string, active: boolean) {
    return this.useCases.setBrandActive.execute({ id, active });
  }
  getBrand(idOrSlug: string) {
    return this.useCases.getBrand.execute(idOrSlug);
  }
  searchBrands(query: SearchReferenceDataQuery) {
    return this.useCases.searchBrands.execute(query);
  }
  listBrands() {
    return this.useCases.listBrands.execute();
  }

  // Fabricante
  createManufacturer(command: CreateManufacturerCommand) {
    return this.useCases.createManufacturer.execute(command);
  }
  updateManufacturer(command: UpdateManufacturerCommand) {
    return this.useCases.updateManufacturer.execute(command);
  }
  setManufacturerActive(id: string, active: boolean) {
    return this.useCases.setManufacturerActive.execute({ id, active });
  }
  getManufacturer(idOrSlug: string) {
    return this.useCases.getManufacturer.execute(idOrSlug);
  }
  searchManufacturers(query: SearchReferenceDataQuery) {
    return this.useCases.searchManufacturers.execute(query);
  }
}
