import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTestContainer, uniqueSuffix } from "../setupTestContainer";
import type { InfrastructureContainer } from "@infrastructure/index";

/**
 * Integration Test — atravessa a cadeia completa (Route→) Use Case →
 * Application Service → Port → Repository Prisma → SQLite real de teste
 * (`prisma/test.db`). Sem mocks: prova que o módulo Catálogo funciona
 * ponta a ponta como composto pelo `InfrastructureContainer` de verdade.
 */
describe("Catálogo — integração ponta a ponta", () => {
  let container: InfrastructureContainer;
  const suffix = uniqueSuffix();
  const createdProductIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdBrandIds: string[] = [];
  const createdSkuIds: string[] = [];

  beforeAll(() => {
    container = buildTestContainer();
  });

  afterAll(async () => {
    const client = container.prisma.client;
    await client.sku.deleteMany({ where: { id: { in: createdSkuIds } } });
    await client.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await client.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
    await client.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
    await container.prisma.disconnect();
  });

  it("cadastra categoria → marca → produto → SKU, publica, e o produto aparece na busca pública", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-cat-${suffix}`,
      name: `Categoria Integração ${suffix}`,
    });
    createdCategoryIds.push(category.id);

    const brand = await container.useCases.createBrand.execute({
      slug: `it-brand-${suffix}`,
      name: `Marca Integração ${suffix}`,
    });
    createdBrandIds.push(brand.id);

    const product = await container.useCases.registerSupplement.execute({
      slug: `it-product-${suffix}`,
      name: `Produto Integração ${suffix}`,
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(product.id);
    expect(product.status).toBe("DRAFT");

    const sku = await container.useCases.createSku.execute({
      productId: product.id,
      gtin: `1${suffix}`.replace(/\D/g, "").padEnd(13, "0").slice(0, 13),
      variantLabel: "300g",
    });
    createdSkuIds.push(sku.id);
    expect(sku.status).toBe("ACTIVE");

    // Rascunho não aparece na busca pública
    const preSearch = await container.useCases.searchSupplements.execute({
      categorySlug: category.slug,
      page: { page: 1, perPage: 10 },
    });
    expect(preSearch.total).toBe(0);

    await container.useCases.setSupplementStatus.execute({ id: product.id, status: "PUBLISHED" });

    const postSearch = await container.useCases.searchSupplements.execute({
      categorySlug: category.slug,
      page: { page: 1, perPage: 10 },
    });
    expect(postSearch.total).toBe(1);
    expect(postSearch.items[0]?.slug).toBe(product.slug);
  });

  it("soft delete de produto (ARCHIVED) some da busca pública mas continua acessível por GetSupplementUseCase", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-cat-del-${suffix}`,
      name: `Categoria Delete ${suffix}`,
    });
    createdCategoryIds.push(category.id);
    const brand = await container.useCases.createBrand.execute({
      slug: `it-brand-del-${suffix}`,
      name: `Marca Delete ${suffix}`,
    });
    createdBrandIds.push(brand.id);

    const product = await container.useCases.registerSupplement.execute({
      slug: `it-product-del-${suffix}`,
      name: `Produto Delete ${suffix}`,
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(product.id);
    await container.useCases.setSupplementStatus.execute({ id: product.id, status: "PUBLISHED" });

    await container.useCases.deleteSupplement.execute({ id: product.id });

    const archived = await container.useCases.getSupplement.execute(product.id);
    expect(archived.status).toBe("ARCHIVED");

    const search = await container.useCases.searchSupplements.execute({
      categorySlug: category.slug,
      page: { page: 1, perPage: 10 },
    });
    expect(search.total).toBe(0);
  });

  it("rejeita slug de produto duplicado e GTIN de SKU duplicado", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-cat-dup-${suffix}`,
      name: `Categoria Dup ${suffix}`,
    });
    createdCategoryIds.push(category.id);
    const brand = await container.useCases.createBrand.execute({
      slug: `it-brand-dup-${suffix}`,
      name: `Marca Dup ${suffix}`,
    });
    createdBrandIds.push(brand.id);

    const product = await container.useCases.registerSupplement.execute({
      slug: `it-product-dup-${suffix}`,
      name: `Produto Dup ${suffix}`,
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(product.id);

    await expect(
      container.useCases.registerSupplement.execute({
        slug: `it-product-dup-${suffix}`,
        name: "Outro",
        categorySlug: category.slug,
        brandSlug: brand.slug,
      }),
    ).rejects.toThrow();

    const gtin = `2${suffix}`.replace(/\D/g, "").padEnd(13, "1").slice(0, 13);
    const sku = await container.useCases.createSku.execute({
      productId: product.id,
      gtin,
      variantLabel: "300g",
    });
    createdSkuIds.push(sku.id);

    await expect(
      container.useCases.createSku.execute({ productId: product.id, gtin, variantLabel: "600g" }),
    ).rejects.toThrow();
  });

  it("grava auditoria real (AuditLog) para o cadastro de um produto", async () => {
    const category = await container.useCases.createCategory.execute({
      slug: `it-cat-audit-${suffix}`,
      name: `Categoria Audit ${suffix}`,
    });
    createdCategoryIds.push(category.id);
    const brand = await container.useCases.createBrand.execute({
      slug: `it-brand-audit-${suffix}`,
      name: `Marca Audit ${suffix}`,
    });
    createdBrandIds.push(brand.id);

    const product = await container.useCases.registerSupplement.execute({
      slug: `it-product-audit-${suffix}`,
      name: `Produto Audit ${suffix}`,
      categorySlug: category.slug,
      brandSlug: brand.slug,
    });
    createdProductIds.push(product.id);

    const entries = await container.prisma.client.auditLog.findMany({
      where: { entityId: product.id, action: "supplement.registered" },
    });
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0]?.actorType).toBe("SYSTEM");
  });
});
