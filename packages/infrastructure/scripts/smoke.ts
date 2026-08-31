/**
 * Smoke test da Infrastructure Layer — usa `buildInfrastructureContainer()`
 * (a composição real, não um double de teste) para provar que os
 * adapters in-memory satisfazem os Ports da Application de ponta a
 * ponta, e que os providers auxiliares (cache, storage, mail, http,
 * fila, hash) funcionam. Rodar com:
 *   npx tsx packages/infrastructure/scripts/smoke.ts
 */
import { buildInfrastructureContainer } from "../src/bootstrap/InfrastructureContainer";
import {
  ProviderNotImplementedError,
  InfrastructureNotConfiguredError,
} from "../src/errors/InfrastructureError";
import { RedisCacheProviderStub } from "../src/providers/cache/RedisCacheProviderStub";
import { S3StorageProviderStub } from "../src/providers/storage/S3StorageProviderStub";
import { AmazonMarketplaceProviderStub } from "../src/external-apis/marketplace/AmazonMarketplaceProviderStub";
import { PrismaSupplementRepositoryStub } from "../src/repositories/PrismaRepositoriesStub";
import { PrismaConnectionPlaceholder } from "../src/persistence/prisma/PrismaConnectionPlaceholder";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FALHOU: ${message}`);
  console.warn(`OK  ${message}`);
}

async function main() {
  // 1. Constrói o container inteiro a partir de env vars simuladas (sem DATABASE_URL, sem REDIS_URL: tudo cai nos adapters in-memory/null por padrão).
  const container = buildInfrastructureContainer({
    NODE_ENV: "test",
    NEXT_PUBLIC_SITE_URL: "https://smoke.local",
  });
  assert(container.config.nodeEnv === "test", "ConfigLoader lê NODE_ENV da fonte informada");
  assert(container.environment.isTest(), "EnvironmentManager reflete a config carregada");

  // 2. Ponta a ponta: semeia categoria/marca diretamente na tabela
  // in-memory (o container não expõe seed — isso é intencional; um app
  // real usaria um RegisterCategory/BrandUseCase quando existirem) e
  // depois usa os Use Cases da Application normalmente.
  container.db.table<{ slug: string; name: string }>("categories").set("creatina", {
    slug: "creatina",
    name: "Creatina",
  });
  container.db.table<{ slug: string; name: string }>("brands").set("marca-x", {
    slug: "marca-x",
    name: "Marca X",
  });

  const categories = await container.useCases.listCategories.execute();
  assert(
    categories.length === 1,
    "Use Case de listagem funciona sobre o repositório real do container",
  );

  const methodology = await container.useCases.createMethodology.execute({
    id: "creatina-v1",
    name: "Metodologia Creatina",
    criteria: [
      { criterionId: "cost-benefit", weight: 0.25 },
      { criterionId: "price-per-dose", weight: 0.15 },
      { criterionId: "label-transparency", weight: 0.25 },
      { criterionId: "reputation", weight: 0.15 },
      { criterionId: "exaggerated-claims", weight: 0.1 },
      { criterionId: "store-reliability", weight: 0.1 },
    ],
  });
  await container.ports.methodologies.setActiveForCategory(
    "creatina",
    methodology.id,
    methodology.version,
  );

  const supplement = await container.useCases.registerSupplement.execute({
    slug: "creatina-x",
    name: "Creatina X",
    categorySlug: "creatina",
    brandSlug: "marca-x",
  });

  const result = await container.useCases.evaluateSupplement.execute({
    supplementId: supplement.id,
    facts: {
      composition: {
        activeIngredientAmountPerServing: 5000,
        referenceRangePerServing: { min: 3000, max: 5000 },
        additives: [],
        undisclosedSubstances: [],
      },
      pricing: { priceInCents: 8990, dosesPerUnit: 60, categoryAveragePricePerDoseInCents: 180 },
      label: {
        hasProprietaryBlend: false,
        nutritionalInfoComplete: true,
        dosageClearlyStated: true,
      },
      reputation: { averageRating: 4.6, reviewCount: 300 },
      marketingClaims: {
        claims: ["aumenta força"],
        scientificallySupportedClaims: ["aumenta força"],
      },
      store: { trustScore: 85, hasBuyerProtection: true },
    },
  });
  assert(
    result.finalScore > 0,
    "EvaluateSupplementUseCase calcula um Índice real usando os adapters do container",
  );

  const auditEntries = (container.ports.auditLog as { all(): readonly unknown[] }).all();
  assert(
    auditEntries.length >= 2,
    "InMemoryAuditLogAdapter registrou as ações (cadastro + avaliação)",
  );

  // 3. Health check
  const health = await container.health.checkAll();
  assert(
    health.status === "healthy" || health.status === "degraded",
    "HealthCheckRegistry agrega os indicadores registrados",
  );
  assert(
    health.checks.some((c) => c.name === "process-memory"),
    "MemoryIndicator está registrado por padrão",
  );

  // 4. Cache provider real (in-memory, já que REDIS_URL não foi informado)
  await container.cache.set("foo", { value: 42 }, 60);
  const cached = await container.cache.get<{ value: number }>("foo");
  assert(cached?.value === 42, "InMemoryCacheProvider funciona (get/set com TTL)");

  // 5. Storage provider real (in-memory)
  const uploaded = await container.storage.upload({
    key: "logo.png",
    content: "conteudo",
    contentType: "text/plain",
  });
  assert(uploaded.url.includes("logo.png"), "InMemoryStorageProvider gera uma URL a partir da key");
  const downloaded = await container.storage.download("logo.png");
  assert(
    downloaded?.toString("utf-8") === "conteudo",
    "InMemoryStorageProvider preserva o conteúdo enviado",
  );

  // 6. Mail provider (null — nenhum MAIL_PROVIDER configurado)
  await container.mail.send({ to: "user@example.com", subject: "Teste", html: "<p>oi</p>" });
  console.warn("OK  NullMailProvider aceita o envio sem lançar (só loga)");

  // 7. Fila em memória
  await container.queue.enqueue("test-queue", { hello: "world" });
  assert((await container.queue.size("test-queue")) === 1, "InMemoryQueueProvider enfileira");
  const message = await container.queue.dequeue<{ hello: string }>("test-queue");
  assert(
    message?.payload.hello === "world",
    "InMemoryQueueProvider desenfileira o payload correto",
  );

  // 8. Hash provider real (scrypt)
  const hash = await container.hashProvider.hash("minha-senha-forte");
  assert(
    await container.hashProvider.verify("minha-senha-forte", hash),
    "NodeCryptoHashProvider verifica corretamente a senha certa",
  );
  assert(
    !(await container.hashProvider.verify("senha-errada", hash)),
    "NodeCryptoHashProvider rejeita a senha errada",
  );

  // 9. Stubs de integrações futuras devem falhar de forma explícita e identificável — nunca silenciosamente "funcionar sem fazer nada"
  try {
    await new RedisCacheProviderStub("redis://example").get("x");
    assert(false, "RedisCacheProviderStub deveria lançar");
  } catch (error) {
    assert(
      error instanceof ProviderNotImplementedError,
      "RedisCacheProviderStub lança ProviderNotImplementedError",
    );
  }

  try {
    await new S3StorageProviderStub("meu-bucket").download("x");
    assert(false, "S3StorageProviderStub deveria lançar");
  } catch (error) {
    assert(
      error instanceof ProviderNotImplementedError,
      "S3StorageProviderStub lança ProviderNotImplementedError",
    );
  }

  try {
    await new AmazonMarketplaceProviderStub().fetchPrice({ searchTerm: "creatina" });
    assert(false, "AmazonMarketplaceProviderStub deveria lançar");
  } catch (error) {
    assert(
      error instanceof ProviderNotImplementedError,
      "AmazonMarketplaceProviderStub lança ProviderNotImplementedError",
    );
  }

  try {
    await new PrismaSupplementRepositoryStub().findById("x");
    assert(false, "PrismaSupplementRepositoryStub deveria lançar");
  } catch (error) {
    assert(
      error instanceof ProviderNotImplementedError,
      "PrismaSupplementRepositoryStub lança ProviderNotImplementedError (Prisma NÃO conectado)",
    );
  }

  try {
    await new PrismaConnectionPlaceholder().connect();
    assert(false, "PrismaConnectionPlaceholder.connect() deveria lançar");
  } catch (error) {
    assert(
      error instanceof InfrastructureNotConfiguredError,
      "PrismaConnectionPlaceholder lança InfrastructureNotConfiguredError",
    );
  }

  console.warn("\nTodos os cenários do smoke test da Infrastructure Layer passaram.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
