/**
 * Smoke test da Infrastructure Layer — usa `buildInfrastructureContainer()`
 * (a composição real, não um double de teste) contra o PostgreSQL (Neon)
 * real de desenvolvimento (`DATABASE_URL`) para provar que os repositórios
 * Prisma do módulo Catálogo persistem de verdade, e que os providers
 * auxiliares (cache, storage, mail, http, fila, hash) funcionam. Isto
 * também serve como Integration Test do módulo Catálogo (ver
 * ARCHITECTURE.md). Rodar com:
 *   npx tsx packages/infrastructure/scripts/smoke.ts
 *
 * Limpa (deleta) todos os dados que cria, ao final — pode ser rodado
 * repetidamente sem sujar o banco de dev.
 */
import { buildInfrastructureContainer } from "../src/bootstrap/InfrastructureContainer";
import { ProviderNotImplementedError } from "../src/errors/InfrastructureError";
import { RedisCacheProviderStub } from "../src/providers/cache/RedisCacheProviderStub";
import { S3StorageProviderStub } from "../src/providers/storage/S3StorageProviderStub";
import { AmazonMarketplaceProviderStub } from "../src/external-apis/marketplace/AmazonMarketplaceProviderStub";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FALHOU: ${message}`);
  console.warn(`OK  ${message}`);
}

async function main() {
  // 1. Constrói o container inteiro apontando para o PostgreSQL (Neon) real de dev.
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada — ver .env.example.");
  }
  const container = buildInfrastructureContainer({
    NODE_ENV: "test",
    NEXT_PUBLIC_SITE_URL: "https://smoke.local",
    DATABASE_URL: process.env.DATABASE_URL,
  });
  assert(container.config.nodeEnv === "test", "ConfigLoader lê NODE_ENV da fonte informada");
  assert(container.environment.isTest(), "EnvironmentManager reflete a config carregada");
  assert(
    await container.prisma.isHealthy(),
    "PrismaConnection conecta de verdade ao PostgreSQL (Neon) de dev",
  );

  const suffix = Date.now();
  const createdCategoryIds: string[] = [];
  const createdBrandIds: string[] = [];
  const createdManufacturerIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdSkuIds: string[] = [];
  const createdMethodologyIds: string[] = [];

  try {
    // 2. CRUD real de Catálogo via Use Cases → repositórios Prisma → PostgreSQL
    const category = await container.useCases.createCategory.execute({
      slug: `smoke-creatina-${suffix}`,
      name: `Creatina (smoke ${suffix})`,
    });
    createdCategoryIds.push(category.id);

    const brand = await container.useCases.createBrand.execute({
      slug: `smoke-marca-${suffix}`,
      name: "Marca Smoke",
    });
    createdBrandIds.push(brand.id);

    const manufacturer = await container.useCases.createManufacturer.execute({
      slug: `smoke-fabrica-${suffix}`,
      name: "Fábrica Smoke",
      country: "Brasil",
      certifications: ["ISO 9001"],
    });
    createdManufacturerIds.push(manufacturer.id);

    const foundCategory = await container.useCases.getCategory.execute(category.slug);
    assert(
      foundCategory.id === category.id,
      "GetCategoryUseCase lê de volta o que PrismaCategoryRepository gravou",
    );

    const categorySearch = await container.useCases.searchCategories.execute({
      search: `smoke ${suffix}`,
      page: { page: 1, perPage: 10 },
    });
    assert(
      categorySearch.total === 1,
      "SearchCategoriesUseCase filtra por nome via Prisma `contains`",
    );

    // 3. Metodologia real via Prisma + Produto + SKU
    const methodology = await container.useCases.createMethodology.execute({
      id: `smoke-methodology-${suffix}`,
      name: "Metodologia Smoke",
      criteria: [
        { criterionId: "cost-benefit", weight: 0.25 },
        { criterionId: "price-per-dose", weight: 0.15 },
        { criterionId: "label-transparency", weight: 0.25 },
        { criterionId: "reputation", weight: 0.15 },
        { criterionId: "exaggerated-claims", weight: 0.1 },
        { criterionId: "store-reliability", weight: 0.1 },
      ],
    });
    createdMethodologyIds.push(methodology.id);
    await container.ports.methodologies.setActiveForCategory(
      category.slug,
      methodology.id,
      methodology.version,
    );

    const supplement = await container.useCases.registerSupplement.execute({
      slug: `smoke-creatina-x-${suffix}`,
      name: "Creatina X (smoke)",
      categorySlug: category.slug,
      brandSlug: brand.slug,
      manufacturerSlug: manufacturer.slug,
    });
    createdProductIds.push(supplement.id);
    assert(
      supplement.status === "DRAFT",
      "RegisterSupplementUseCase persiste status DRAFT no Prisma",
    );

    const sku = await container.useCases.createSku.execute({
      productId: supplement.id,
      gtin: `789000${suffix}`.slice(0, 13),
      variantLabel: "300g",
    });
    createdSkuIds.push(sku.id);
    assert(sku.status === "ACTIVE", "CreateSkuUseCase persiste SKU real no Prisma");

    await container.useCases.setSupplementStatus.execute({
      id: supplement.id,
      status: "PUBLISHED",
    });
    const publishedProduct = await container.useCases.getSupplement.execute(supplement.slug);
    assert(
      publishedProduct.status === "PUBLISHED",
      "SetSupplementStatusUseCase persiste a transição de status no Prisma",
    );

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

    // 4. Auditoria real no Prisma (AuditLog.actorType = SYSTEM, ver PrismaAuditLogAdapter)
    const auditCount = await container.prisma.client.auditLog.count({
      where: { entityId: supplement.id },
    });
    assert(auditCount >= 1, "PrismaAuditLogAdapter grava linhas reais em AuditLog");

    // 5. Health check
    const health = await container.health.checkAll();
    assert(
      health.status === "healthy" || health.status === "degraded",
      "HealthCheckRegistry agrega os indicadores registrados",
    );
    assert(
      health.checks.some((c) => c.name === "process-memory"),
      "MemoryIndicator está registrado por padrão",
    );

    // 6. Cache provider real (in-memory, já que REDIS_URL não foi informado)
    await container.cache.set("foo", { value: 42 }, 60);
    const cached = await container.cache.get<{ value: number }>("foo");
    assert(cached?.value === 42, "InMemoryCacheProvider funciona (get/set com TTL)");

    // 7. Storage provider real (in-memory)
    const uploaded = await container.storage.upload({
      key: "logo.png",
      content: "conteudo",
      contentType: "text/plain",
    });
    assert(
      uploaded.url.includes("logo.png"),
      "InMemoryStorageProvider gera uma URL a partir da key",
    );
    const downloaded = await container.storage.download("logo.png");
    assert(
      downloaded?.toString("utf-8") === "conteudo",
      "InMemoryStorageProvider preserva o conteúdo enviado",
    );

    // 8. Mail provider (null — nenhum MAIL_PROVIDER configurado)
    await container.mail.send({ to: "user@example.com", subject: "Teste", html: "<p>oi</p>" });
    console.warn("OK  NullMailProvider aceita o envio sem lançar (só loga)");

    // 9. Fila em memória
    await container.queue.enqueue("test-queue", { hello: "world" });
    assert((await container.queue.size("test-queue")) === 1, "InMemoryQueueProvider enfileira");
    const message = await container.queue.dequeue<{ hello: string }>("test-queue");
    assert(
      message?.payload.hello === "world",
      "InMemoryQueueProvider desenfileira o payload correto",
    );

    // 10. Hash provider real (scrypt)
    const hash = await container.hashProvider.hash("minha-senha-forte");
    assert(
      await container.hashProvider.verify("minha-senha-forte", hash),
      "NodeCryptoHashProvider verifica corretamente a senha certa",
    );
    assert(
      !(await container.hashProvider.verify("senha-errada", hash)),
      "NodeCryptoHashProvider rejeita a senha errada",
    );

    // 11. Stubs de integrações futuras devem falhar de forma explícita e identificável
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

    // 12. Ranking real via Prisma — gera e lê de volta o snapshot
    const ranking = await container.useCases.generateRanking.execute({
      categorySlug: category.slug,
    });
    assert(
      ranking.entries.length === 1,
      "GenerateRankingUseCase persiste um Ranking real via PrismaRankingRepository",
    );
    const latestRanking = await container.ports.rankings.findLatest(category.slug);
    assert(
      latestRanking?.entries[0]?.supplementId === supplement.id,
      "PrismaRankingRepository.findLatest lê o snapshot gravado",
    );

    const latestScore = await container.useCases.getSupplementScore.execute(supplement.id);
    assert(
      latestScore.finalScore === result.finalScore,
      "GetSupplementScoreUseCase lê o Índice mais recente via Prisma",
    );

    const history = await container.useCases.listSupplementScoreHistory.execute(supplement.id);
    assert(
      history.length === 1,
      "ListSupplementScoreHistoryUseCase lê o histórico via Prisma (append-only)",
    );

    console.warn("\nTodos os cenários do smoke test da Infrastructure Layer passaram.");
  } finally {
    // 12. Limpeza — mantém o banco de dev livre de lixo entre execuções.
    const client = container.prisma.client;
    await client.rankingEntry.deleteMany({ where: { productId: { in: createdProductIds } } });
    await client.ranking.deleteMany({ where: { categoryId: { in: createdCategoryIds } } });
    await client.auditLog.deleteMany({ where: { entityId: { in: createdProductIds } } });
    await client.productScore.deleteMany({ where: { productId: { in: createdProductIds } } });
    await client.sku.deleteMany({ where: { id: { in: createdSkuIds } } });
    await client.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await client.manufacturer.deleteMany({ where: { id: { in: createdManufacturerIds } } });
    await client.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
    // Cascata da Category remove CategoryActiveMethodology antes de apagar a Methodology (Restrict).
    await client.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    await client.methodology.deleteMany({ where: { id: { in: createdMethodologyIds } } });
    await container.prisma.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
