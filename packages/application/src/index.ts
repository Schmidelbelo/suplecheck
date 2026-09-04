// SupleScore Application Layer — orquestra o Core Domain via Use Cases,
// Ports, Commands/Queries e DTOs. Depende de @suplecheck/core; nenhuma
// entidade de Domain atravessa esta fronteira para fora (ver
// packages/application/ARCHITECTURE.md).

// Shared
export type { UseCase, ParameterlessUseCase } from "./shared/UseCase";
export type { PageRequest, PageResult } from "./shared/Pagination";
export { buildPageResult, defaultPageRequest } from "./shared/Pagination";

// Errors
export * from "./errors/ApplicationError";

// DTOs
export type { SupplementDTO, ProductStatusDTO } from "./dto/SupplementDTO";
export type { CategoryDTO, BrandDTO, ManufacturerDTO } from "./dto/CatalogDTO";
export type { SkuDTO, SkuStatusDTO } from "./dto/SkuDTO";
export type { CriterionDTO, CriterionKindDTO, CriterionStatusDTO } from "./dto/CriterionDTO";
export type {
  MethodologyDTO,
  CriterionAssignmentDTO,
  ClassificationBandDTO,
  CategoryOverrideDTO,
} from "./dto/MethodologyDTO";
export type {
  IndexResultDTO,
  CriterionBreakdownDTO,
  TechnicalNoteDTO,
  ValidationFlagDTO,
} from "./dto/IndexResultDTO";
export type {
  RankingDTO,
  RankingEntryDTO,
  ComparisonDTO,
  IndexResultSummaryDTO,
} from "./dto/RankingDTO";

// Commands
export type {
  RegisterSupplementCommand,
  UpdateSupplementCommand,
  EvaluateSupplementCommand,
  SetSupplementStatusCommand,
  DeleteSupplementCommand,
  ProductStatusCommandValue,
} from "./commands/SupplementCommands";
export type {
  CreateCategoryCommand,
  UpdateCategoryCommand,
  CreateBrandCommand,
  UpdateBrandCommand,
  CreateManufacturerCommand,
  UpdateManufacturerCommand,
  SetReferenceDataActiveCommand,
} from "./commands/CatalogCommands";
export type {
  CreateSkuCommand,
  UpdateSkuCommand,
  SetSkuStatusCommand,
  SkuStatusCommandValue,
} from "./commands/SkuCommands";
export type {
  CreateMethodologyCommand,
  CreateMethodologyCriterionInput,
  ReviseMethodologyCommand,
  MethodologyVersionBump,
  RegisterCriterionCommand,
  SetCriterionStatusCommand,
  UpdateCriterionWeightsCommand,
} from "./commands/MethodologyCommands";
export type { GenerateRankingCommand } from "./commands/RankingCommands";
export type {
  ImportDataCommand,
  ExportDataCommand,
  RecordAuditEntryCommand,
  RecordAnalyticsEventCommand,
} from "./commands/PlatformCommands";

// Queries
export type {
  SearchSupplementsQuery,
  CompareSupplementsQuery,
  SearchReferenceDataQuery,
  ListSkusByProductQuery,
  GetRankingQuery,
} from "./queries/CatalogQueries";

// Ports
export * from "./ports";

// Mappers
export { SupplementMapper } from "./mappers/SupplementMapper";
export { CategoryMapper, BrandMapper, ManufacturerMapper } from "./mappers/CatalogMapper";
export { SkuMapper } from "./mappers/SkuMapper";
export { MethodologyMapper, type MethodologyDTOExtras } from "./mappers/MethodologyMapper";
export { CriterionMapper } from "./mappers/CriterionMapper";
export { IndexResultMapper } from "./mappers/IndexResultMapper";
export { RankingMapper } from "./mappers/RankingMapper";

// Factories
export { EvaluationContextFactory } from "./factories/EvaluationContextFactory";
export { SupplementProfileFactory } from "./factories/SupplementProfileFactory";
export { UseCaseFactory, type AllUseCases } from "./factories/UseCaseFactory";

// Policies
export { SupplementRegistrationPolicy } from "./policies/SupplementRegistrationPolicy";
export { MethodologyRevisionPolicy } from "./policies/MethodologyRevisionPolicy";
export { CriterionDeactivationPolicy } from "./policies/CriterionDeactivationPolicy";
export { RankingGenerationPolicy } from "./policies/RankingGenerationPolicy";

// Validators
export type {
  ApplicationValidator,
  ValidationResult,
  ValidationIssue,
} from "./validators/Validator";
export { ValidationIssueCollector } from "./validators/Validator";
export {
  RegisterSupplementValidator,
  EvaluateSupplementValidator,
} from "./validators/SupplementValidators";
export { CreateMethodologyValidator } from "./validators/MethodologyValidators";
export {
  CreateCategoryValidator,
  CreateBrandValidator,
  CreateManufacturerValidator,
} from "./validators/CatalogValidators";
export { CreateSkuValidator } from "./validators/SkuValidators";

// Use Cases (exportados individualmente também, para quem quiser montar
// só um em vez de usar `UseCaseFactory.create` inteiro)
export { RegisterSupplementUseCase } from "./use-cases/supplement/RegisterSupplementUseCase";
export { UpdateSupplementUseCase } from "./use-cases/supplement/UpdateSupplementUseCase";
export { EvaluateSupplementUseCase } from "./use-cases/supplement/EvaluateSupplementUseCase";
export {
  CalculateIndexUseCase,
  type CalculateIndexRequest,
} from "./use-cases/supplement/CalculateIndexUseCase";
export { GetSupplementUseCase } from "./use-cases/supplement/GetSupplementUseCase";
export {
  SetSupplementStatusUseCase,
  DeleteSupplementUseCase,
} from "./use-cases/supplement/SupplementStatusUseCases";
export {
  GetSupplementScoreUseCase,
  ListSupplementScoreHistoryUseCase,
} from "./use-cases/supplement/ScoreQueryUseCases";
export { RecalculateSupplementScoreUseCase } from "./use-cases/supplement/RecalculateSupplementScoreUseCase";
export { SearchSupplementsUseCase } from "./use-cases/catalog/SearchSupplementsUseCase";
export { CompareSupplementsUseCase } from "./use-cases/catalog/CompareSupplementsUseCase";
export { ListCategoriesUseCase } from "./use-cases/catalog/ListCategoriesUseCase";
export { ListBrandsUseCase } from "./use-cases/catalog/ListBrandsUseCase";
export {
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  SetCategoryActiveUseCase,
  GetCategoryUseCase,
} from "./use-cases/catalog/CategoryCrudUseCases";
export {
  CreateBrandUseCase,
  UpdateBrandUseCase,
  SetBrandActiveUseCase,
  GetBrandUseCase,
} from "./use-cases/catalog/BrandCrudUseCases";
export {
  CreateManufacturerUseCase,
  UpdateManufacturerUseCase,
  SetManufacturerActiveUseCase,
  GetManufacturerUseCase,
} from "./use-cases/catalog/ManufacturerCrudUseCases";
export {
  SearchCategoriesUseCase,
  SearchBrandsUseCase,
  SearchManufacturersUseCase,
} from "./use-cases/catalog/SearchReferenceDataUseCases";
export {
  CreateSkuUseCase,
  UpdateSkuUseCase,
  SetSkuStatusUseCase,
  GetSkuUseCase,
} from "./use-cases/sku/SkuCrudUseCases";
export { ListSkusByProductUseCase } from "./use-cases/sku/ListSkusByProductUseCase";
export { CreateMethodologyUseCase } from "./use-cases/methodology/CreateMethodologyUseCase";
export { ReviseMethodologyUseCase } from "./use-cases/methodology/ReviseMethodologyUseCase";
export { RegisterCriterionUseCase } from "./use-cases/methodology/RegisterCriterionUseCase";
export { SetCriterionStatusUseCase } from "./use-cases/methodology/SetCriterionStatusUseCase";
export { UpdateCriterionWeightsUseCase } from "./use-cases/methodology/UpdateCriterionWeightsUseCase";
export { GenerateRankingUseCase } from "./use-cases/ranking/GenerateRankingUseCase";
export { ImportDataUseCase, type ImportDataResult } from "./use-cases/platform/ImportDataUseCase";
export { ExportDataUseCase } from "./use-cases/platform/ExportDataUseCase";
export { RecordAuditEntryUseCase } from "./use-cases/platform/RecordAuditEntryUseCase";
export { RecordAnalyticsEventUseCase } from "./use-cases/platform/RecordAnalyticsEventUseCase";

// Application Services (fachadas)
export { SupplementApplicationService } from "./services/SupplementApplicationService";
export { CatalogApplicationService } from "./services/CatalogApplicationService";
export { SkuApplicationService } from "./services/SkuApplicationService";
export { MethodologyApplicationService } from "./services/MethodologyApplicationService";
export { RankingApplicationService } from "./services/RankingApplicationService";
export { PlatformApplicationService } from "./services/PlatformApplicationService";
