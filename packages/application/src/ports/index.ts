export * from "./SupplementRepositoryPort";
export * from "./CatalogRepositoryPort";
export * from "./MethodologyRepositoryPort";
export * from "./CriterionCatalogPort";
export * from "./IndexResultRepositoryPort";
export * from "./RankingRepositoryPort";
export * from "./AuditLogPort";
export * from "./AnalyticsPort";
export * from "./SystemPorts";
export * from "./ImportExportPorts";

import type { SupplementRepositoryPort } from "./SupplementRepositoryPort";
import type { CategoryRepositoryPort, BrandRepositoryPort } from "./CatalogRepositoryPort";
import type { MethodologyRepositoryPort } from "./MethodologyRepositoryPort";
import type { CriterionCatalogPort } from "./CriterionCatalogPort";
import type { IndexResultRepositoryPort } from "./IndexResultRepositoryPort";
import type { RankingRepositoryPort } from "./RankingRepositoryPort";
import type { AuditLogPort } from "./AuditLogPort";
import type { AnalyticsPort } from "./AnalyticsPort";
import type { ClockPort, IdGeneratorPort } from "./SystemPorts";

/**
 * Conjunto completo de Ports que a plataforma precisa. `UseCaseFactory`
 * (ver `factories/UseCaseFactory.ts`) recebe exatamente isto — um único
 * objeto — e devolve todos os Use Cases já conectados. Quando
 * Infrastructure existir, ela só precisa produzir um `ApplicationPorts`
 * válido; nenhum Use Case precisa ser tocado.
 */
export interface ApplicationPorts {
  readonly supplements: SupplementRepositoryPort;
  readonly categories: CategoryRepositoryPort;
  readonly brands: BrandRepositoryPort;
  readonly methodologies: MethodologyRepositoryPort;
  readonly criteria: CriterionCatalogPort;
  readonly indexResults: IndexResultRepositoryPort;
  readonly rankings: RankingRepositoryPort;
  readonly auditLog: AuditLogPort;
  readonly analytics: AnalyticsPort;
  readonly clock: ClockPort;
  readonly idGenerator: IdGeneratorPort;
}
