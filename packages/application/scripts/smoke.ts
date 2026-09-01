/**
 * Smoke test da Application Layer — exercita o fluxo completo (CRUD de
 * catálogo → criar metodologia → avaliar → gerar ranking → comparar →
 * revisar metodologia → gerenciar critérios) só através de Use
 * Cases/Application Services, usando os adapters em memória de
 * `test-support/` (nunca Infrastructure real). Rodar com:
 *   npx tsx packages/application/scripts/smoke.ts
 */
import type { ApplicationPorts } from "../src/ports";
import { UseCaseFactory } from "../src/factories/UseCaseFactory";
import { SupplementApplicationService } from "../src/services/SupplementApplicationService";
import { CatalogApplicationService } from "../src/services/CatalogApplicationService";
import { SkuApplicationService } from "../src/services/SkuApplicationService";
import { MethodologyApplicationService } from "../src/services/MethodologyApplicationService";
import { RankingApplicationService } from "../src/services/RankingApplicationService";
import {
  PolicyViolationError,
  ValidationFailedError,
  DuplicateSupplementSlugError,
  DuplicateSlugError,
  DuplicateSkuGtinError,
} from "../src/errors/ApplicationError";
import {
  InMemorySupplementRepository,
  InMemoryCategoryRepository,
  InMemoryBrandRepository,
  InMemoryManufacturerRepository,
  InMemorySkuRepository,
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
  const categories = new InMemoryCategoryRepository();
  const brands = new InMemoryBrandRepository();
  const manufacturers = new InMemoryManufacturerRepository();
  const skus = new InMemorySkuRepository();
  const methodologies = new InMemoryMethodologyRepository();
  const indexResults = new InMemoryIndexResultRepository();
  const auditLog = new InMemoryAuditLog();
  const analytics = new InMemoryAnalytics();
  const rankings = new InMemoryRankingRepository();

  const ports: ApplicationPorts = {
    supplements,
    categories,
    brands,
    manufacturers,
    skus,
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
  const catalogService = new CatalogApplicationService(useCases);
  const skuService = new SkuApplicationService(useCases);
  const methodologyService = new MethodologyApplicationService(useCases);
  const rankingService = new RankingApplicationService(useCases, rankings);

  // 2. CRUD de catálogo: Categoria, Marca, Fabricante
  const category = await catalogService.createCategory({ slug: "creatina", name: "Creatina" });
  assert(category.active, "CreateCategoryUseCase cria categoria ativa por padrão");

  const updatedCategory = await catalogService.updateCategory({
    id: category.id,
    description: "Suplementos de creatina",
  });
  assert(
    updatedCategory.description === "Suplementos de creatina",
    "UpdateCategoryUseCase atualiza campos parciais",
  );

  const brand = await catalogService.createBrand({ slug: "marca-x", name: "Marca X" });
  const manufacturer = await catalogService.createManufacturer({
    slug: "fabrica-y",
    name: "Fábrica Y",
    country: "Brasil",
  });

  try {
    await catalogService.createCategory({ slug: "creatina", name: "Duplicada" });
    assert(false, "slug de categoria duplicado deveria falhar");
  } catch (error) {
    assert(
      error instanceof DuplicateSlugError,
      "SearchCategoriesUseCase/CreateCategoryUseCase rejeita slug duplicado",
    );
  }

  await catalogService.setCategoryActive(category.id, false);
  const inactiveSearch = await catalogService.searchCategories({ page: { page: 1, perPage: 10 } });
  assert(
    inactiveSearch.total === 0,
    "SearchCategoriesUseCase, por padrão, não retorna categorias inativas",
  );
  await catalogService.setCategoryActive(category.id, true);

  // 3. Cadastrar metodologia
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
  await ports.methodologies.setActiveForCategory("creatina", methodology.id, methodology.version);

  // 4. Cadastrar 2 suplementos (com fabricante) + seus SKUs
  const productA = await supplementService.register({
    slug: "creatina-a",
    name: "Creatina A",
    categorySlug: "creatina",
    brandSlug: "marca-x",
    manufacturerSlug: manufacturer.slug,
  });
  const productB = await supplementService.register({
    slug: "creatina-b",
    name: "Creatina B",
    categorySlug: "creatina",
    brandSlug: "marca-x",
  });
  assert(
    productA.status === "DRAFT",
    "RegisterSupplementUseCase cria produto como DRAFT (Domain Model §3.1)",
  );

  const skuA = await skuService.create({
    productId: productA.id,
    gtin: "7891234500019",
    variantLabel: "300g",
  });
  assert(skuA.status === "ACTIVE", "CreateSkuUseCase cria SKU ativo por padrão");

  try {
    await skuService.create({ productId: productB.id, gtin: skuA.gtin!, variantLabel: "outro" });
    assert(false, "GTIN duplicado deveria falhar");
  } catch (error) {
    assert(error instanceof DuplicateSkuGtinError, "CreateSkuUseCase rejeita GTIN duplicado");
  }

  await skuService.delete(skuA.id);
  const skuAfterDelete = await skuService.get(skuA.id);
  assert(
    skuAfterDelete.status === "DISCONTINUED",
    "SkuApplicationService.delete é soft delete (DISCONTINUED, não remove)",
  );

  await supplementService.setStatus({ id: productA.id, status: "PUBLISHED" });
  await supplementService.setStatus({ id: productB.id, status: "PUBLISHED" });

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

  // 6. Buscar (só PUBLISHED por padrão)
  const publicSearch = await supplementService.search({
    categorySlug: "creatina",
    page: { page: 1, perPage: 10 },
  });
  assert(publicSearch.total === 2, "SearchSupplementsUseCase (público) retorna só PUBLISHED");

  await supplementService.setStatus({ id: productB.id, status: "ARCHIVED" });
  const publicSearchAfterArchive = await supplementService.search({
    categorySlug: "creatina",
    page: { page: 1, perPage: 10 },
  });
  assert(
    publicSearchAfterArchive.total === 1,
    "produto ARCHIVED (soft delete) some da busca pública, mas continua existindo",
  );
  const archived = await supplementService.get(productB.id);
  assert(
    archived.status === "ARCHIVED",
    "GetSupplementUseCase ainda encontra o produto arquivado (não foi removido)",
  );

  // 7. Gerar e ler ranking
  const ranking = await rankingService.generate({ categorySlug: "creatina" });
  assert(
    ranking.entries.length === 2,
    "GenerateRankingUseCase usa listLatestByCategory (inclui avaliações mesmo de produto já arquivado)",
  );
  assert(
    ranking.entries[0]?.supplementId === productA.id,
    "ranking ordena por nota final, maior primeiro",
  );

  // 8. Comparar
  const comparison = await supplementService.compare({ supplementIds: [productA.id, productB.id] });
  assert(
    comparison.items.length === 2,
    "CompareSupplementsUseCase retorna os 2 resultados mais recentes",
  );

  // 9. Revisar metodologia
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

  try {
    await methodologyService.revise({ methodologyId: "creatina-v1", bump: "patch" });
    assert(false, "revisão sem alterar nada deveria ser rejeitada");
  } catch (error) {
    assert(
      error instanceof PolicyViolationError,
      "MethodologyRevisionPolicy rejeita revisão sem mudança real",
    );
  }

  // 10. Validação de Application antes de tocar o Domain
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
