import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  PrismaCategoryRepository,
  PrismaBrandRepository,
  PrismaManufacturerRepository,
} from "../src/repositories/prisma/PrismaReferenceDataRepositories";

/**
 * Repository Test — exercita `PrismaCategoryRepository`/`PrismaBrandRepository`/
 * `PrismaManufacturerRepository` diretamente (sem passar por Use Cases),
 * contra o PostgreSQL (Neon) real configurado em `DATABASE_URL`.
 */
const client = new PrismaClient();
const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const categoryRepo = new PrismaCategoryRepository(client);
const brandRepo = new PrismaBrandRepository(client);
const manufacturerRepo = new PrismaManufacturerRepository(client);

const createdCategoryIds: string[] = [];
const createdBrandIds: string[] = [];
const createdManufacturerIds: string[] = [];

afterAll(async () => {
  await client.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  await client.brand.deleteMany({ where: { id: { in: createdBrandIds } } });
  await client.manufacturer.deleteMany({ where: { id: { in: createdManufacturerIds } } });
  await client.$disconnect();
});

describe("PrismaCategoryRepository", () => {
  it("save() grava e findBySlug() lê de volta", async () => {
    const now = new Date();
    const id = crypto.randomUUID();
    createdCategoryIds.push(id);
    await categoryRepo.save({
      id,
      slug: `repo-test-cat-${suffix}`,
      name: "Categoria Repo Test",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const found = await categoryRepo.findBySlug(`repo-test-cat-${suffix}`);
    expect(found?.id).toBe(id);
    expect(found?.name).toBe("Categoria Repo Test");
  });

  it("setActive(false) faz soft delete — some da search() padrão mas continua em findById()", async () => {
    const now = new Date();
    const id = crypto.randomUUID();
    createdCategoryIds.push(id);
    await categoryRepo.save({
      id,
      slug: `repo-test-cat-inactive-${suffix}`,
      name: "Categoria Inativa",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await categoryRepo.setActive(id, false);

    const found = await categoryRepo.findById(id);
    expect(found?.active).toBe(false);

    const searchResult = await categoryRepo.search(
      { search: `repo-test-cat-inactive-${suffix}` },
      { page: 1, perPage: 10 },
    );
    expect(searchResult.total).toBe(0);
  });

  it("search() pagina e filtra por nome via contains", async () => {
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const id = crypto.randomUUID();
      createdCategoryIds.push(id);
      await categoryRepo.save({
        id,
        slug: `repo-test-page-${suffix}-${i}`,
        name: `Página Teste ${suffix} ${i}`,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const result = await categoryRepo.search(
      { search: `Página Teste ${suffix}` },
      { page: 1, perPage: 2 },
    );
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(2);
    expect(result.totalPages).toBe(2);
  });
});

describe("PrismaBrandRepository", () => {
  it("save() e findBySlug() funcionam", async () => {
    const now = new Date();
    const id = crypto.randomUUID();
    createdBrandIds.push(id);
    await brandRepo.save({
      id,
      slug: `repo-test-brand-${suffix}`,
      name: "Marca Repo Test",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const found = await brandRepo.findBySlug(`repo-test-brand-${suffix}`);
    expect(found?.name).toBe("Marca Repo Test");
  });
});

describe("PrismaManufacturerRepository", () => {
  it("save() preserva certifications (Json) e findBySlug() as devolve como array", async () => {
    const now = new Date();
    const id = crypto.randomUUID();
    createdManufacturerIds.push(id);
    await manufacturerRepo.save({
      id,
      slug: `repo-test-manuf-${suffix}`,
      name: "Fábrica Repo Test",
      country: "Brasil",
      certifications: ["ISO 9001", "ANVISA"],
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const found = await manufacturerRepo.findBySlug(`repo-test-manuf-${suffix}`);
    expect(found?.certifications).toEqual(["ISO 9001", "ANVISA"]);
  });
});
