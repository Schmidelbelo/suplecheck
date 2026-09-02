import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { uniqueSuffix } from "../setupTestContainer";

/**
 * API Test — chama os handlers de `src/app/api/catalog/**` diretamente
 * (sem subir um servidor HTTP), como o Next.js os invocaria, contra o
 * mesmo PostgreSQL (Neon) real usado pelos outros testes (`DATABASE_URL`
 * em `.env`).
 */
const suffix = uniqueSuffix();
const cleanupClient = new PrismaClient();

afterAll(async () => {
  await cleanupClient.sku.deleteMany({ where: { variantLabel: { contains: suffix } } });
  await cleanupClient.product.deleteMany({ where: { slug: { contains: suffix } } });
  await cleanupClient.brand.deleteMany({ where: { slug: { contains: suffix } } });
  await cleanupClient.category.deleteMany({ where: { slug: { contains: suffix } } });
  await cleanupClient.$disconnect();
});

describe("API /api/catalog/categories", () => {
  it("POST cria, GET lista e GET [idOrSlug] busca", async () => {
    const { POST, GET } = await import("../../src/app/api/catalog/categories/route");
    const { GET: GET_BY_ID } =
      await import("../../src/app/api/catalog/categories/[idOrSlug]/route");

    const createRes = await POST(
      new Request("http://localhost/api/catalog/categories", {
        method: "POST",
        body: JSON.stringify({ slug: `api-cat-${suffix}`, name: `Categoria API ${suffix}` }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.slug).toBe(`api-cat-${suffix}`);

    const listRes = await GET(
      new Request(`http://localhost/api/catalog/categories?search=${suffix}`),
    );
    const list = await listRes.json();
    expect(list.total).toBe(1);

    const getRes = await GET_BY_ID(new Request("http://localhost/api/catalog/categories/x"), {
      params: Promise.resolve({ idOrSlug: created.slug }),
    });
    expect(getRes.status).toBe(200);
    const found = await getRes.json();
    expect(found.id).toBe(created.id);
  });

  it("GET [idOrSlug] retorna 404 para categoria inexistente", async () => {
    const { GET: GET_BY_ID } =
      await import("../../src/app/api/catalog/categories/[idOrSlug]/route");
    const res = await GET_BY_ID(new Request("http://localhost/api/catalog/categories/x"), {
      params: Promise.resolve({ idOrSlug: `nao-existe-${suffix}` }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("CATEGORY_NOT_FOUND");
  });

  it("POST com slug duplicado retorna 409", async () => {
    const { POST } = await import("../../src/app/api/catalog/categories/route");
    const slug = `api-cat-dup-${suffix}`;
    await POST(
      new Request("http://localhost/api/catalog/categories", {
        method: "POST",
        body: JSON.stringify({ slug, name: "Original" }),
      }),
    );
    const res = await POST(
      new Request("http://localhost/api/catalog/categories", {
        method: "POST",
        body: JSON.stringify({ slug, name: "Duplicada" }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it("POST com slug inválido retorna 422", async () => {
    const { POST } = await import("../../src/app/api/catalog/categories/route");
    const res = await POST(
      new Request("http://localhost/api/catalog/categories", {
        method: "POST",
        body: JSON.stringify({ slug: "Slug Inválido!", name: "X" }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("DELETE [idOrSlug] faz soft delete (desativa, some da busca padrão)", async () => {
    const { POST } = await import("../../src/app/api/catalog/categories/route");
    const { DELETE, GET } = await import("../../src/app/api/catalog/categories/[idOrSlug]/route");
    const slug = `api-cat-del-${suffix}`;
    const createRes = await POST(
      new Request("http://localhost/api/catalog/categories", {
        method: "POST",
        body: JSON.stringify({ slug, name: "Para Deletar" }),
      }),
    );
    const created = await createRes.json();

    const delRes = await DELETE(new Request("http://localhost/api/catalog/categories/x"), {
      params: Promise.resolve({ idOrSlug: slug }),
    });
    expect(delRes.status).toBe(204);

    const getRes = await GET(new Request("http://localhost/api/catalog/categories/x"), {
      params: Promise.resolve({ idOrSlug: created.id }),
    });
    const stillThere = await getRes.json();
    expect(stillThere.active).toBe(false);
  });
});

describe("API /api/catalog/products + skus", () => {
  it("cadastra produto e SKU via API, publica e some/aparece corretamente na busca pública", async () => {
    const { POST: POST_CAT } = await import("../../src/app/api/catalog/categories/route");
    const { POST: POST_BRAND } = await import("../../src/app/api/catalog/brands/route");
    const { POST: POST_PRODUCT, GET: GET_PRODUCTS } =
      await import("../../src/app/api/catalog/products/route");
    const { PUT: PUT_STATUS } =
      await import("../../src/app/api/catalog/products/[idOrSlug]/status/route");
    const { POST: POST_SKU } =
      await import("../../src/app/api/catalog/products/[idOrSlug]/skus/route");

    const category = await (
      await POST_CAT(
        new Request("http://localhost/api/catalog/categories", {
          method: "POST",
          body: JSON.stringify({ slug: `api-prod-cat-${suffix}`, name: "Categoria" }),
        }),
      )
    ).json();
    const brand = await (
      await POST_BRAND(
        new Request("http://localhost/api/catalog/brands", {
          method: "POST",
          body: JSON.stringify({ slug: `api-prod-brand-${suffix}`, name: "Marca" }),
        }),
      )
    ).json();

    const productRes = await POST_PRODUCT(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        body: JSON.stringify({
          slug: `api-product-${suffix}`,
          name: "Produto API",
          categorySlug: category.slug,
          brandSlug: brand.slug,
        }),
      }),
    );
    expect(productRes.status).toBe(201);
    const product = await productRes.json();
    expect(product.status).toBe("DRAFT");

    const skuRes = await POST_SKU(
      new Request("http://localhost/api/catalog/products/x/skus", {
        method: "POST",
        body: JSON.stringify({ variantLabel: `300g-${suffix}` }),
      }),
      { params: Promise.resolve({ idOrSlug: product.slug }) },
    );
    expect(skuRes.status).toBe(201);

    const preSearchRes = await GET_PRODUCTS(
      new Request(`http://localhost/api/catalog/products?categorySlug=${category.slug}`),
    );
    const preSearch = await preSearchRes.json();
    expect(preSearch.total).toBe(0);

    await PUT_STATUS(
      new Request("http://localhost/api/catalog/products/x/status", {
        method: "PUT",
        body: JSON.stringify({ status: "PUBLISHED" }),
      }),
      { params: Promise.resolve({ idOrSlug: product.slug }) },
    );

    const postSearchRes = await GET_PRODUCTS(
      new Request(`http://localhost/api/catalog/products?categorySlug=${category.slug}`),
    );
    const postSearch = await postSearchRes.json();
    expect(postSearch.total).toBe(1);
  });
});
