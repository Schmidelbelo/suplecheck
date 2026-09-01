// SupleCheck Infrastructure Layer — implementa os Ports da Application
// Layer (persistência, cache, storage, mail, filas, APIs externas...).
// Depende de @suplecheck/application (e, só via PrismaCriterionCatalogAdapter,
// de @suplecheck/core). Nenhum Use Case conhece este pacote — é o
// contrário: este pacote é quem sabe compor Use Cases prontos para uso.
// Ver ARCHITECTURE.md para a documentação completa.

// Bootstrap (o que a maioria de quem consome este pacote realmente usa)
export {
  buildInfrastructureContainer,
  type InfrastructureContainer,
} from "./bootstrap/InfrastructureContainer";

// Config
export type { AppConfig } from "./config/Config";
export { ConfigLoader } from "./config/ConfigLoader";
export { EnvironmentManager } from "./config/EnvironmentManager";

// Errors
export * from "./errors/InfrastructureError";

// Logging
export type { Logger, LogLevel, LogContext } from "./logging/Logger";
export { ConsoleLogger } from "./logging/ConsoleLogger";
export { NullLogger } from "./logging/NullLogger";

// Telemetry
export type { TelemetryProvider, Span, MetricTags } from "./telemetry/TelemetryProvider";
export { NoopTelemetryProvider } from "./telemetry/NoopTelemetryProvider";

// Monitoring
export type {
  HealthIndicator,
  HealthCheckResult,
  HealthStatus,
  AggregatedHealth,
} from "./monitoring/HealthCheck";
export { HealthCheckRegistry } from "./monitoring/HealthCheckRegistry";
export { MemoryIndicator } from "./monitoring/indicators/MemoryIndicator";

// Persistence
export type { PersistenceProvider } from "./persistence/PersistenceProvider";
export { InMemoryDatabase } from "./persistence/inmemory/InMemoryDatabase";
export { PrismaConnection } from "./persistence/prisma/PrismaConnection";

// Repositories — Catálogo (Prisma, implementação real)
export {
  PrismaCategoryRepository,
  PrismaBrandRepository,
  PrismaManufacturerRepository,
} from "./repositories/prisma/PrismaReferenceDataRepositories";
export { PrismaSupplementRepository } from "./repositories/prisma/PrismaSupplementRepository";
export { PrismaSkuRepository } from "./repositories/prisma/PrismaSkuRepository";
export { PrismaAuditLogAdapter } from "./repositories/prisma/PrismaAuditLogAdapter";

// Repositories — Avaliação/Ranking (Prisma, implementação real)
export { PrismaMethodologyRepository } from "./repositories/prisma/PrismaMethodologyRepository";
export { PrismaIndexResultRepository } from "./repositories/prisma/PrismaIndexResultRepository";
export { PrismaRankingRepository } from "./repositories/prisma/PrismaRankingRepository";
export { PrismaCriterionCatalogAdapter } from "./repositories/prisma/PrismaCriterionCatalogAdapter";

// Adapters (Ports não cobertos por repositories)
export { InMemoryAuditLogAdapter, ConsoleAuditLogAdapter } from "./adapters/AuditLogAdapters";
export { InternalAnalyticsAdapter } from "./adapters/InternalAnalyticsAdapter";
export { SystemClockAdapter, RandomUuidAdapter } from "./adapters/SystemProviders";
export {
  InMemoryImportSourceAdapter,
  NullExportSinkAdapter,
} from "./adapters/ImportExportAdapters";

// Providers — Cache
export type { CacheProvider } from "./providers/cache/CacheProvider";
export { InMemoryCacheProvider } from "./providers/cache/InMemoryCacheProvider";
export { RedisCacheProviderStub } from "./providers/cache/RedisCacheProviderStub";

// Providers — Storage
export type {
  StorageProvider,
  UploadInput,
  StoredObject,
} from "./providers/storage/StorageProvider";
export { InMemoryStorageProvider } from "./providers/storage/InMemoryStorageProvider";
export { S3StorageProviderStub } from "./providers/storage/S3StorageProviderStub";
export { R2StorageProviderStub } from "./providers/storage/R2StorageProviderStub";

// Providers — Mail
export type { MailProvider, MailMessage } from "./providers/mail/MailProvider";
export { NullMailProvider } from "./providers/mail/NullMailProvider";
export { SmtpMailProviderStub } from "./providers/mail/SmtpMailProviderStub";
export { ResendMailProviderStub } from "./providers/mail/ResendMailProviderStub";

// Providers — HTTP
export type { HttpClient, HttpRequestOptions, HttpResponse } from "./providers/http/HttpClient";
export { FetchHttpClient } from "./providers/http/FetchHttpClient";

// Providers — Queue
export type { QueueProvider, QueueMessage } from "./providers/queue/QueueProvider";
export { InMemoryQueueProvider } from "./providers/queue/InMemoryQueueProvider";

// Providers — Scheduler
export type { SchedulerProvider, ScheduledTask } from "./providers/scheduler/SchedulerProvider";
export { NullSchedulerProvider } from "./providers/scheduler/NullSchedulerProvider";

// Providers — Security
export type { HashProvider } from "./providers/security/HashProvider";
export { NodeCryptoHashProvider } from "./providers/security/NodeCryptoHashProvider";
export type { SecretsProvider } from "./providers/security/SecretsProvider";
export { EnvSecretsProvider } from "./providers/security/EnvSecretsProvider";

// External APIs — Marketplace
export type {
  MarketplacePriceProvider,
  ProductReference,
  PriceQuote,
} from "./external-apis/marketplace/MarketplacePriceProvider";
export { AmazonMarketplaceProviderStub } from "./external-apis/marketplace/AmazonMarketplaceProviderStub";
export { MercadoLivreMarketplaceProviderStub } from "./external-apis/marketplace/MercadoLivreMarketplaceProviderStub";
export { ShopeeMarketplaceProviderStub } from "./external-apis/marketplace/ShopeeMarketplaceProviderStub";
export { MagaluMarketplaceProviderStub } from "./external-apis/marketplace/MagaluMarketplaceProviderStub";

// External APIs — Analytics
export type { ExternalAnalyticsProvider } from "./external-apis/analytics/ExternalAnalyticsProvider";
export { GoogleAnalyticsProviderStub } from "./external-apis/analytics/GoogleAnalyticsProviderStub";
export { MicrosoftClarityProviderStub } from "./external-apis/analytics/MicrosoftClarityProviderStub";

// Transactions
export type { TransactionManager } from "./transactions/TransactionManager";
export { InMemoryTransactionManager } from "./transactions/InMemoryTransactionManager";
export { PrismaTransactionManagerStub } from "./transactions/PrismaTransactionManagerStub";
