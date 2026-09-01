import type { ApplicationPorts } from "../ports";
import { RegisterSupplementUseCase } from "../use-cases/supplement/RegisterSupplementUseCase";
import { UpdateSupplementUseCase } from "../use-cases/supplement/UpdateSupplementUseCase";
import { EvaluateSupplementUseCase } from "../use-cases/supplement/EvaluateSupplementUseCase";
import { CalculateIndexUseCase } from "../use-cases/supplement/CalculateIndexUseCase";
import { GetSupplementUseCase } from "../use-cases/supplement/GetSupplementUseCase";
import {
  SetSupplementStatusUseCase,
  DeleteSupplementUseCase,
} from "../use-cases/supplement/SupplementStatusUseCases";
import {
  GetSupplementScoreUseCase,
  ListSupplementScoreHistoryUseCase,
} from "../use-cases/supplement/ScoreQueryUseCases";
import { RecalculateSupplementScoreUseCase } from "../use-cases/supplement/RecalculateSupplementScoreUseCase";
import { SearchSupplementsUseCase } from "../use-cases/catalog/SearchSupplementsUseCase";
import { CompareSupplementsUseCase } from "../use-cases/catalog/CompareSupplementsUseCase";
import { ListCategoriesUseCase } from "../use-cases/catalog/ListCategoriesUseCase";
import { ListBrandsUseCase } from "../use-cases/catalog/ListBrandsUseCase";
import {
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  SetCategoryActiveUseCase,
  GetCategoryUseCase,
} from "../use-cases/catalog/CategoryCrudUseCases";
import {
  CreateBrandUseCase,
  UpdateBrandUseCase,
  SetBrandActiveUseCase,
  GetBrandUseCase,
} from "../use-cases/catalog/BrandCrudUseCases";
import {
  CreateManufacturerUseCase,
  UpdateManufacturerUseCase,
  SetManufacturerActiveUseCase,
  GetManufacturerUseCase,
} from "../use-cases/catalog/ManufacturerCrudUseCases";
import {
  SearchCategoriesUseCase,
  SearchBrandsUseCase,
  SearchManufacturersUseCase,
} from "../use-cases/catalog/SearchReferenceDataUseCases";
import {
  CreateSkuUseCase,
  UpdateSkuUseCase,
  SetSkuStatusUseCase,
  GetSkuUseCase,
} from "../use-cases/sku/SkuCrudUseCases";
import { ListSkusByProductUseCase } from "../use-cases/sku/ListSkusByProductUseCase";
import { CreateMethodologyUseCase } from "../use-cases/methodology/CreateMethodologyUseCase";
import { ReviseMethodologyUseCase } from "../use-cases/methodology/ReviseMethodologyUseCase";
import { RegisterCriterionUseCase } from "../use-cases/methodology/RegisterCriterionUseCase";
import { SetCriterionStatusUseCase } from "../use-cases/methodology/SetCriterionStatusUseCase";
import { UpdateCriterionWeightsUseCase } from "../use-cases/methodology/UpdateCriterionWeightsUseCase";
import { GenerateRankingUseCase } from "../use-cases/ranking/GenerateRankingUseCase";
import { ImportDataUseCase } from "../use-cases/platform/ImportDataUseCase";
import { ExportDataUseCase } from "../use-cases/platform/ExportDataUseCase";
import { RecordAuditEntryUseCase } from "../use-cases/platform/RecordAuditEntryUseCase";
import { RecordAnalyticsEventUseCase } from "../use-cases/platform/RecordAnalyticsEventUseCase";

export interface AllUseCases {
  readonly registerSupplement: RegisterSupplementUseCase;
  readonly updateSupplement: UpdateSupplementUseCase;
  readonly evaluateSupplement: EvaluateSupplementUseCase;
  readonly calculateIndex: CalculateIndexUseCase;
  readonly getSupplementScore: GetSupplementScoreUseCase;
  readonly listSupplementScoreHistory: ListSupplementScoreHistoryUseCase;
  readonly recalculateSupplementScore: RecalculateSupplementScoreUseCase;
  readonly getSupplement: GetSupplementUseCase;
  readonly setSupplementStatus: SetSupplementStatusUseCase;
  readonly deleteSupplement: DeleteSupplementUseCase;
  readonly searchSupplements: SearchSupplementsUseCase;
  readonly compareSupplements: CompareSupplementsUseCase;
  readonly listCategories: ListCategoriesUseCase;
  readonly listBrands: ListBrandsUseCase;
  readonly createCategory: CreateCategoryUseCase;
  readonly updateCategory: UpdateCategoryUseCase;
  readonly setCategoryActive: SetCategoryActiveUseCase;
  readonly getCategory: GetCategoryUseCase;
  readonly searchCategories: SearchCategoriesUseCase;
  readonly createBrand: CreateBrandUseCase;
  readonly updateBrand: UpdateBrandUseCase;
  readonly setBrandActive: SetBrandActiveUseCase;
  readonly getBrand: GetBrandUseCase;
  readonly searchBrands: SearchBrandsUseCase;
  readonly createManufacturer: CreateManufacturerUseCase;
  readonly updateManufacturer: UpdateManufacturerUseCase;
  readonly setManufacturerActive: SetManufacturerActiveUseCase;
  readonly getManufacturer: GetManufacturerUseCase;
  readonly searchManufacturers: SearchManufacturersUseCase;
  readonly createSku: CreateSkuUseCase;
  readonly updateSku: UpdateSkuUseCase;
  readonly setSkuStatus: SetSkuStatusUseCase;
  readonly getSku: GetSkuUseCase;
  readonly listSkusByProduct: ListSkusByProductUseCase;
  readonly createMethodology: CreateMethodologyUseCase;
  readonly reviseMethodology: ReviseMethodologyUseCase;
  readonly registerCriterion: RegisterCriterionUseCase;
  readonly setCriterionStatus: SetCriterionStatusUseCase;
  readonly updateCriterionWeights: UpdateCriterionWeightsUseCase;
  readonly generateRanking: GenerateRankingUseCase;
  readonly importData: ImportDataUseCase;
  readonly exportData: ExportDataUseCase;
  readonly recordAuditEntry: RecordAuditEntryUseCase;
  readonly recordAnalyticsEvent: RecordAnalyticsEventUseCase;
}

/**
 * Composition root da Application Layer: o único lugar que sabe montar
 * TODOS os Use Cases a partir de um `ApplicationPorts`. Quando
 * Infrastructure existir, ela só precisa chamar
 * `UseCaseFactory.create(ports)` — nunca instancia um Use Case
 * individualmente com `new`, o que manteria o conhecimento de "quais
 * Ports cada Use Case precisa" espalhado por fora desta camada.
 */
export const UseCaseFactory = {
  create(ports: ApplicationPorts): AllUseCases {
    const evaluateSupplement = new EvaluateSupplementUseCase(
      ports.supplements,
      ports.methodologies,
      ports.indexResults,
      ports.criteria,
      ports.clock,
      ports.auditLog,
      ports.analytics,
    );

    return {
      registerSupplement: new RegisterSupplementUseCase(
        ports.supplements,
        ports.categories,
        ports.brands,
        ports.clock,
        ports.idGenerator,
        ports.auditLog,
      ),
      updateSupplement: new UpdateSupplementUseCase(ports.supplements, ports.clock, ports.auditLog),
      evaluateSupplement,
      calculateIndex: new CalculateIndexUseCase(ports.criteria),
      getSupplementScore: new GetSupplementScoreUseCase(ports.indexResults),
      listSupplementScoreHistory: new ListSupplementScoreHistoryUseCase(ports.indexResults),
      recalculateSupplementScore: new RecalculateSupplementScoreUseCase(
        ports.indexResults,
        evaluateSupplement,
      ),
      getSupplement: new GetSupplementUseCase(ports.supplements),
      setSupplementStatus: new SetSupplementStatusUseCase(
        ports.supplements,
        ports.clock,
        ports.auditLog,
      ),
      deleteSupplement: new DeleteSupplementUseCase(ports.supplements, ports.clock, ports.auditLog),
      searchSupplements: new SearchSupplementsUseCase(ports.supplements),
      compareSupplements: new CompareSupplementsUseCase(ports.supplements, ports.indexResults),
      listCategories: new ListCategoriesUseCase(ports.categories),
      listBrands: new ListBrandsUseCase(ports.brands),
      createCategory: new CreateCategoryUseCase(
        ports.categories,
        ports.clock,
        ports.idGenerator,
        ports.auditLog,
      ),
      updateCategory: new UpdateCategoryUseCase(ports.categories, ports.clock, ports.auditLog),
      setCategoryActive: new SetCategoryActiveUseCase(
        ports.categories,
        ports.clock,
        ports.auditLog,
      ),
      getCategory: new GetCategoryUseCase(ports.categories),
      searchCategories: new SearchCategoriesUseCase(ports.categories),
      createBrand: new CreateBrandUseCase(
        ports.brands,
        ports.clock,
        ports.idGenerator,
        ports.auditLog,
      ),
      updateBrand: new UpdateBrandUseCase(ports.brands, ports.clock, ports.auditLog),
      setBrandActive: new SetBrandActiveUseCase(ports.brands, ports.clock, ports.auditLog),
      getBrand: new GetBrandUseCase(ports.brands),
      searchBrands: new SearchBrandsUseCase(ports.brands),
      createManufacturer: new CreateManufacturerUseCase(
        ports.manufacturers,
        ports.clock,
        ports.idGenerator,
        ports.auditLog,
      ),
      updateManufacturer: new UpdateManufacturerUseCase(
        ports.manufacturers,
        ports.clock,
        ports.auditLog,
      ),
      setManufacturerActive: new SetManufacturerActiveUseCase(
        ports.manufacturers,
        ports.clock,
        ports.auditLog,
      ),
      getManufacturer: new GetManufacturerUseCase(ports.manufacturers),
      searchManufacturers: new SearchManufacturersUseCase(ports.manufacturers),
      createSku: new CreateSkuUseCase(
        ports.skus,
        ports.supplements,
        ports.clock,
        ports.idGenerator,
        ports.auditLog,
      ),
      updateSku: new UpdateSkuUseCase(ports.skus, ports.clock, ports.auditLog),
      setSkuStatus: new SetSkuStatusUseCase(ports.skus, ports.clock, ports.auditLog),
      getSku: new GetSkuUseCase(ports.skus),
      listSkusByProduct: new ListSkusByProductUseCase(ports.skus),
      createMethodology: new CreateMethodologyUseCase(
        ports.methodologies,
        ports.clock,
        ports.auditLog,
      ),
      reviseMethodology: new ReviseMethodologyUseCase(
        ports.methodologies,
        ports.clock,
        ports.auditLog,
      ),
      registerCriterion: new RegisterCriterionUseCase(ports.criteria, ports.clock, ports.auditLog),
      setCriterionStatus: new SetCriterionStatusUseCase(
        ports.criteria,
        ports.methodologies,
        ports.clock,
        ports.auditLog,
      ),
      updateCriterionWeights: new UpdateCriterionWeightsUseCase(
        ports.methodologies,
        ports.clock,
        ports.auditLog,
      ),
      generateRanking: new GenerateRankingUseCase(
        ports.indexResults,
        ports.methodologies,
        ports.rankings,
        ports.clock,
        ports.auditLog,
        ports.analytics,
      ),
      importData: new ImportDataUseCase(),
      exportData: new ExportDataUseCase(),
      recordAuditEntry: new RecordAuditEntryUseCase(ports.auditLog, ports.clock),
      recordAnalyticsEvent: new RecordAnalyticsEventUseCase(ports.analytics, ports.clock),
    };
  },
};
