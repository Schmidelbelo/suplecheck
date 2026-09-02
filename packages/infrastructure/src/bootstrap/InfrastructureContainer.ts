import type { ApplicationPorts, AllUseCases } from "../application-kernel";
import { UseCaseFactory } from "../application-kernel";

import { ConfigLoader } from "../config/ConfigLoader";
import { EnvironmentManager } from "../config/EnvironmentManager";
import type { AppConfig } from "../config/Config";

import type { Logger } from "../logging/Logger";
import { ConsoleLogger } from "../logging/ConsoleLogger";

import { PrismaConnection } from "../persistence/prisma/PrismaConnection";

import {
  PrismaCategoryRepository,
  PrismaBrandRepository,
  PrismaManufacturerRepository,
} from "../repositories/prisma/PrismaReferenceDataRepositories";
import { PrismaSupplementRepository } from "../repositories/prisma/PrismaSupplementRepository";
import { PrismaSkuRepository } from "../repositories/prisma/PrismaSkuRepository";
import { PrismaAuditLogAdapter } from "../repositories/prisma/PrismaAuditLogAdapter";
import { PrismaMethodologyRepository } from "../repositories/prisma/PrismaMethodologyRepository";
import { PrismaIndexResultRepository } from "../repositories/prisma/PrismaIndexResultRepository";
import { PrismaRankingRepository } from "../repositories/prisma/PrismaRankingRepository";
import { PrismaCriterionCatalogAdapter } from "../repositories/prisma/PrismaCriterionCatalogAdapter";

import { InternalAnalyticsAdapter } from "../adapters/InternalAnalyticsAdapter";
import { SystemClockAdapter, RandomUuidAdapter } from "../adapters/SystemProviders";

import { HealthCheckRegistry } from "../monitoring/HealthCheckRegistry";
import { MemoryIndicator } from "../monitoring/indicators/MemoryIndicator";
import { DatabaseIndicator } from "../monitoring/indicators/DatabaseIndicator";
import { NoopTelemetryProvider } from "../telemetry/NoopTelemetryProvider";
import type { TelemetryProvider } from "../telemetry/TelemetryProvider";

import type { CacheProvider } from "../providers/cache/CacheProvider";
import { InMemoryCacheProvider } from "../providers/cache/InMemoryCacheProvider";
import { RedisCacheProviderStub } from "../providers/cache/RedisCacheProviderStub";

import type { StorageProvider } from "../providers/storage/StorageProvider";
import { InMemoryStorageProvider } from "../providers/storage/InMemoryStorageProvider";
import { S3StorageProviderStub } from "../providers/storage/S3StorageProviderStub";
import { R2StorageProviderStub } from "../providers/storage/R2StorageProviderStub";

import type { MailProvider } from "../providers/mail/MailProvider";
import { NullMailProvider } from "../providers/mail/NullMailProvider";
import { SmtpMailProviderStub } from "../providers/mail/SmtpMailProviderStub";
import { ResendMailProviderStub } from "../providers/mail/ResendMailProviderStub";

import type { HttpClient } from "../providers/http/HttpClient";
import { FetchHttpClient } from "../providers/http/FetchHttpClient";

import type { QueueProvider } from "../providers/queue/QueueProvider";
import { InMemoryQueueProvider } from "../providers/queue/InMemoryQueueProvider";

import type { SchedulerProvider } from "../providers/scheduler/SchedulerProvider";
import { NullSchedulerProvider } from "../providers/scheduler/NullSchedulerProvider";

import type { HashProvider } from "../providers/security/HashProvider";
import { NodeCryptoHashProvider } from "../providers/security/NodeCryptoHashProvider";
import type { SecretsProvider } from "../providers/security/SecretsProvider";
import { EnvSecretsProvider } from "../providers/security/EnvSecretsProvider";

export interface InfrastructureContainer {
  readonly config: AppConfig;
  readonly environment: EnvironmentManager;
  readonly logger: Logger;
  readonly prisma: PrismaConnection;
  readonly ports: ApplicationPorts;
  readonly useCases: AllUseCases;
  readonly health: HealthCheckRegistry;
  readonly cache: CacheProvider;
  readonly storage: StorageProvider;
  readonly mail: MailProvider;
  readonly httpClient: HttpClient;
  readonly queue: QueueProvider;
  readonly scheduler: SchedulerProvider;
  readonly hashProvider: HashProvider;
  readonly secrets: SecretsProvider;
  readonly telemetry: TelemetryProvider;
}

/**
 * Único lugar de toda a plataforma que decide QUAL implementação
 * concreta cada abstração recebe. Nem Application nem Domain sabem que
 * este arquivo existe — ele é consumido por uma futura camada de
 * Presentation (ex: `apps/web` chamaria
 * `buildInfrastructureContainer().useCases.registerSupplement.execute(...)`).
 *
 * Trocar "in-memory" por "Prisma" no futuro é uma mudança CONTIDA
 * NESTE ARQUIVO — nenhum Use Case, Port, Mapper ou Policy muda.
 */
export function buildInfrastructureContainer(
  envSource: Record<string, string | undefined> = process.env,
): InfrastructureContainer {
  const config = ConfigLoader.load(envSource);
  const environment = new EnvironmentManager(config);
  const logger = new ConsoleLogger(config.logging.level);

  // --- Catálogo + Avaliação: persistidos de verdade via Prisma (Domain
  // Model completo — ver ARCHITECTURE.md §3). Sem DATABASE_URL
  // configurada não há como cumprir "persistir dados reais no banco",
  // então falha cedo e claro em vez de mascarar com um fallback
  // silencioso em memória. ---
  if (!environment.hasDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL não configurada — a plataforma requer Prisma conectado (ver .env.example).",
    );
  }
  const prisma = new PrismaConnection(config.database.url!);

  // --- Ports da Application (ver ARCHITECTURE.md §3 para a matriz completa) ---
  const supplements = new PrismaSupplementRepository(prisma.client);
  const categories = new PrismaCategoryRepository(prisma.client);
  const brands = new PrismaBrandRepository(prisma.client);
  const manufacturers = new PrismaManufacturerRepository(prisma.client);
  const skus = new PrismaSkuRepository(prisma.client);
  const methodologies = new PrismaMethodologyRepository(prisma.client);
  const criteria = new PrismaCriterionCatalogAdapter(prisma.client);
  const indexResults = new PrismaIndexResultRepository(prisma.client);
  const rankings = new PrismaRankingRepository(prisma.client);
  const auditLog = new PrismaAuditLogAdapter(prisma.client);
  const analytics = new InternalAnalyticsAdapter(logger);
  const clock = new SystemClockAdapter();
  const idGenerator = new RandomUuidAdapter();

  const ports: ApplicationPorts = {
    supplements,
    categories,
    brands,
    manufacturers,
    skus,
    methodologies,
    criteria,
    indexResults,
    rankings,
    auditLog,
    analytics,
    clock,
    idGenerator,
  };

  const useCases = UseCaseFactory.create(ports);

  // --- Monitoramento ---
  const health = new HealthCheckRegistry();
  health.register(new MemoryIndicator());
  health.register(new DatabaseIndicator(prisma));

  // --- Providers transversais (escolhidos por config; stub quando a integração real não existe ainda) ---
  const cache: CacheProvider =
    config.cache.provider === "redis" && config.cache.redisUrl
      ? new RedisCacheProviderStub(config.cache.redisUrl)
      : new InMemoryCacheProvider();

  const storage: StorageProvider =
    config.storage.provider === "s3" && config.storage.bucket
      ? new S3StorageProviderStub(config.storage.bucket)
      : config.storage.provider === "r2" && config.storage.bucket
        ? new R2StorageProviderStub(config.storage.bucket)
        : new InMemoryStorageProvider(config.siteUrl);

  const mail: MailProvider =
    config.mail.provider === "resend" && environment.hasResendConfigured()
      ? new ResendMailProviderStub(config.mail.resendApiKey!)
      : config.mail.provider === "smtp" && config.mail.smtp
        ? new SmtpMailProviderStub(config.mail.smtp.host)
        : new NullMailProvider(logger);

  const httpClient: HttpClient = new FetchHttpClient();
  const queue: QueueProvider = new InMemoryQueueProvider();
  const scheduler: SchedulerProvider = new NullSchedulerProvider(logger);
  const hashProvider: HashProvider = new NodeCryptoHashProvider();
  const secrets: SecretsProvider = new EnvSecretsProvider(envSource);
  const telemetry: TelemetryProvider = new NoopTelemetryProvider();

  return {
    config,
    environment,
    logger,
    prisma,
    ports,
    useCases,
    health,
    cache,
    storage,
    mail,
    httpClient,
    queue,
    scheduler,
    hashProvider,
    secrets,
    telemetry,
  };
}
