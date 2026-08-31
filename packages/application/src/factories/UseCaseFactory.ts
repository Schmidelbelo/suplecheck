import type { ApplicationPorts } from "../ports";
import { RegisterSupplementUseCase } from "../use-cases/supplement/RegisterSupplementUseCase";
import { UpdateSupplementUseCase } from "../use-cases/supplement/UpdateSupplementUseCase";
import { EvaluateSupplementUseCase } from "../use-cases/supplement/EvaluateSupplementUseCase";
import { CalculateIndexUseCase } from "../use-cases/supplement/CalculateIndexUseCase";
import { SearchSupplementsUseCase } from "../use-cases/catalog/SearchSupplementsUseCase";
import { CompareSupplementsUseCase } from "../use-cases/catalog/CompareSupplementsUseCase";
import { ListCategoriesUseCase } from "../use-cases/catalog/ListCategoriesUseCase";
import { ListBrandsUseCase } from "../use-cases/catalog/ListBrandsUseCase";
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
  readonly searchSupplements: SearchSupplementsUseCase;
  readonly compareSupplements: CompareSupplementsUseCase;
  readonly listCategories: ListCategoriesUseCase;
  readonly listBrands: ListBrandsUseCase;
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
 * Infrastructure existir, o código de bootstrap dela chama só
 * `UseCaseFactory.create(ports)` — nunca instancia um Use Case
 * individualmente com `new`, o que manteria o conhecimento de "quais
 * Ports cada Use Case precisa" espalhado por fora desta camada.
 */
export const UseCaseFactory = {
  create(ports: ApplicationPorts): AllUseCases {
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
      evaluateSupplement: new EvaluateSupplementUseCase(
        ports.supplements,
        ports.methodologies,
        ports.indexResults,
        ports.criteria,
        ports.clock,
        ports.auditLog,
        ports.analytics,
      ),
      calculateIndex: new CalculateIndexUseCase(ports.criteria),
      searchSupplements: new SearchSupplementsUseCase(ports.supplements),
      compareSupplements: new CompareSupplementsUseCase(ports.supplements, ports.indexResults),
      listCategories: new ListCategoriesUseCase(ports.categories),
      listBrands: new ListBrandsUseCase(ports.brands),
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
