/**
 * Smoke test da Application Layer — exercita o fluxo completo (registrar
 * suplemento → criar metodologia → avaliar → gerar ranking → comparar →
 * revisar metodologia → gerenciar critérios) só através de Use
 * Cases/Application Services, usando os adapters em memória de
 * `test-support/` (nunca Infrastructure real). Rodar com:
 *   npx tsx packages/application/scripts/smoke.ts
 */
import type { ApplicationPorts } from "../src/ports";
import { UseCaseFactory } from "../src/factories/UseCaseFactory";
import { SupplementApplicationService } from "../src/services/SupplementApplicationService";
import { MethodologyApplicationService } from "../src/services/MethodologyApplicationService";
import { CatalogApplicationService } from "../src/services/CatalogApplicationService";
import { RankingApplicationService } from "../src/services/RankingApplicationService";
import {
  PolicyViolationError,
  ValidationFailedError,
  DuplicateSupplementSlugError,
} from "../src/errors/ApplicationError";
import {
  InMemorySupplementRepository,
  InMemoryCategoryRepository,
  InMemoryBrandRepository,
  InMemoryMethodologyRepository,
  InMemoryCriterionCatalog,
  InMemoryIndexResultRepository,
  InMemoryRankingRepository,
  InMemoryAuditLog,
  InMemoryAnalytics,
  FixedClock,
  SequentialIdGenerator,
} from "../test-support/InMemoryAdapters";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FALHOU: ${message}`);
  console.warn(`OK  ${message}`);
}

async function main() {
  // 1. Monta os Ports (in-memory) e todos os Use Cases via a Factory —
  // nenhum `new XyzUseCase(...)` manual fora daqui.
  const supplements = new InMemorySupplementRepository();
  const methodologies = new InMemoryMethodologyRepository();
  const indexResults = new InMemoryIndexResultRepository();
  const auditLog = new InMemoryAuditLog();
  const analytics = new InMemoryAnalytics();
  const rankings = new InMemoryRankingRepository();

  const ports: ApplicationPorts = {
    supplements,
    categories: new InMemoryCategoryRepository([{ slug: "creatina", name: "Creatina" }]),
    brands: new InMemoryBrandRepository([{ slug: "marca-x", name: "Marca X" }]),
    methodologies,
    criteria: new InMemoryCriterionCatalog(),
    indexResults,
    rankings,
    auditLog,
    analytics,
    clock: new FixedClock(),
    idGenerator: new SequentialIdGenerator(),
  };

  const useCases = UseCaseFactory.create(ports);
  const supplementService = new SupplementApplicationService(useCases);
  const methodologyService = new MethodologyApplicationService(useCases);
  const catalogService = new CatalogApplicationService(useCases);
  const rankingService = new RankingApplicationService(useCases, rankings);

  // 2. Listar catálogo (queries simples)
  const categories = await catalogService.listCategories();
  assert(
    categories.length === 1 && categories[0]?.slug === "creatina",
    "ListCategoriesUseCase retorna DTOs puros",
  );
  const brands = await catalogService.listBrands();
  assert(brands.length === 1, "ListBrandsUseCase funcional");

  // 3. Cadastrar metodologia (Application Service → Use Case → Domain via mapper)
  const methodology = await methodologyService.create({
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
  assert(methodology.version === "1.0.0", "CreateMethodologyUseCase produz DTO com versão 1.0.0");
  await ports.methodologies.setActiveForCategory("creatina", methodology.id, methodology.version);

  // 4. Cadastrar 2 suplementos
  const productA = await supplementService.register({
    slug: "creatina-a",
    name: "Creatina A",
    categorySlug: "creatina",
    brandSlug: "marca-x",
  });
  const productB = await supplementService.register({
    slug: "creatina-b",
    name: "Creatina B",
    categorySlug: "creatina",
    brandSlug: "marca-x",
  });
  assert(
    productA.id !== productB.id,
    "RegisterSupplementUseCase gera ids distintos via IdGeneratorPort",
  );

  try {
    await supplementService.register({
      slug: "creatina-a",
      name: "Duplicada",
      categorySlug: "creatina",
      brandSlug: "marca-x",
    });
    assert(false, "slug duplicado deveria falhar");
  } catch (error) {
    assert(
      error instanceof DuplicateSupplementSlugError,
      "SupplementRegistrationPolicy rejeita slug duplicado",
    );
  }

  // 5. Avaliar os dois suplementos (facts diferentes → notas diferentes)
  const facts = (score: "alta" | "baixa") => ({
    composition: {
      activeIngredientAmountPerServing: score === "alta" ? 5000 : 2000,
      referenceRangePerServing: { min: 3000, max: 5000 },
      additives: [],
      undisclosedSubstances: [] as string[],
    },
    pricing: { priceInCents: 8990, dosesPerUnit: 60, categoryAveragePricePerDoseInCents: 180 },
    label: {
      hasProprietaryBlend: score !== "alta",
      nutritionalInfoComplete: true,
      dosageClearlyStated: true,
    },
    reputation: { averageRating: score === "alta" ? 4.7 : 3.2, reviewCount: 200 },
    marketingClaims: {
      claims: ["aumenta força"],
      scientificallySupportedClaims: score === "alta" ? ["aumenta força"] : [],
    },
    store: { trustScore: 85, hasBuyerProtection: true },
  });

  const resultA = await supplementService.evaluate({
    supplementId: productA.id,
    facts: facts("alta"),
  });
  const resultB = await supplementService.evaluate({
    supplementId: productB.id,
    facts: facts("baixa"),
  });
  assert(
    resultA.finalScore > resultB.finalScore,
    "produto com fatos melhores recebe nota mais alta",
  );
  assert(resultA.methodologyId === "creatina-v1", "resultado referencia a metodologia usada");

  // 6. IndexResultDTO nunca deve conter instância de classe do Domain — só primitivos/arrays/objetos planos.
  assert(
    typeof resultA.finalScore === "number",
    "finalScore é number puro, não um Value Object Score",
  );
  assert(typeof resultA.classificationTier === "string", "classificationTier é string pura");

  // 7. Auditoria e analytics foram de fato registrados pela orquestração
  assert(
    auditLog.entries.some((e) => e.action === "supplement.evaluated"),
    "EvaluateSupplementUseCase grava auditoria",
  );
  assert(
    analytics.events.some((e) => e.name === "index_calculated"),
    "EvaluateSupplementUseCase grava analytics",
  );

  // 8. Gerar ranking da categoria
  const ranking = await rankingService.generate({ categorySlug: "creatina" });
  assert(ranking.entries.length === 2, "GenerateRankingUseCase inclui os 2 suplementos avaliados");
  assert(
    ranking.entries[0]?.supplementId === productA.id,
    "ranking ordena por nota final, maior primeiro",
  );

  const fetchedRanking = await rankingService.get({ categorySlug: "creatina" });
  assert(
    fetchedRanking.generatedAt === ranking.generatedAt,
    "RankingApplicationService.get lê o snapshot persistido",
  );

  // 9. Comparar suplementos
  const comparison = await supplementService.compare({ supplementIds: [productA.id, productB.id] });
  assert(
    comparison.items.length === 2,
    "CompareSupplementsUseCase retorna os 2 resultados mais recentes",
  );

  // 10. Buscar suplementos (paginação)
  const search = await supplementService.search({
    categorySlug: "creatina",
    page: { page: 1, perPage: 10 },
  });
  assert(search.total === 2, "SearchSupplementsUseCase encontra os 2 suplementos cadastrados");

  // 11. Revisar metodologia — nova versão, versão anterior preservada
  const revised = await methodologyService.revise({
    methodologyId: "creatina-v1",
    bump: "minor",
    criteria: [
      { criterionId: "cost-benefit", weight: 0.3 },
      { criterionId: "price-per-dose", weight: 0.1 },
      { criterionId: "label-transparency", weight: 0.25 },
      { criterionId: "reputation", weight: 0.15 },
      { criterionId: "exaggerated-claims", weight: 0.1 },
      { criterionId: "store-reliability", weight: 0.1 },
    ],
  });
  assert(revised.version === "1.1.0", "ReviseMethodologyUseCase incrementa a versão (minor)");
  const versions = await ports.methodologies.listVersions("creatina-v1");
  assert(
    versions.length === 2,
    "versão anterior (1.0.0) continua persistida ao lado da nova (1.1.0)",
  );

  // 12. Política: revisão sem mudança nenhuma deve ser rejeitada
  try {
    await methodologyService.revise({ methodologyId: "creatina-v1", bump: "patch" });
    assert(false, "revisão sem alterar nada deveria ser rejeitada");
  } catch (error) {
    assert(
      error instanceof PolicyViolationError,
      "MethodologyRevisionPolicy rejeita revisão sem mudança real",
    );
  }

  // 13. Gerenciar pesos (caso particular de revisão) — precisa continuar
  // somando 1: tira de price-per-dose o que dá a cost-benefit.
  const reweighted = await methodologyService.updateWeights({
    methodologyId: "creatina-v1",
    weights: [
      { criterionId: "cost-benefit", weight: 0.4 },
      { criterionId: "price-per-dose", weight: 0 },
    ],
  });
  assert(
    reweighted.version === "1.1.1",
    "UpdateCriterionWeightsUseCase versiona como patch por padrão",
  );

  // 14. Ativar/desativar critério
  await methodologyService.setCriterionStatus({
    criterionId: "exaggerated-claims",
    status: "DISABLED",
  });
  const criteriaList = await ports.criteria.listAll();
  assert(
    criteriaList.some((c) => c.metadata.id.value === "exaggerated-claims"),
    "critério desativado continua no catálogo (só o status muda)",
  );

  // 15. Validação de Application (antes de tocar o Domain)
  try {
    await supplementService.register({
      slug: "SLUG INVALIDO",
      name: "X",
      categorySlug: "creatina",
      brandSlug: "marca-x",
    });
    assert(false, "slug fora do padrão deveria falhar na validação");
  } catch (error) {
    assert(
      error instanceof ValidationFailedError,
      "RegisterSupplementValidator rejeita slug mal formatado",
    );
  }

  console.warn("\nTodos os cenários do smoke test da Application Layer passaram.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
