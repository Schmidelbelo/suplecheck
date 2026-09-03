import { describe, it, expect } from "vitest";

/**
 * `/api/market` é somente leitura sobre dados já existentes no
 * catálogo (as avaliações reais de creatina inseridas pelo seed) —
 * sem criar nem limpar dados, ao contrário dos demais testes de API
 * que exercitam POST/DELETE.
 */
describe("API /api/market", () => {
  it("retorna estatísticas gerais e ranking de marcas do catálogo real", async () => {
    const { GET } = await import("../../src/app/api/market/route");
    const res = await GET(new Request("http://localhost/api/market"));

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.statistics.productCount).toBeGreaterThan(0);
    expect(body.statistics.brandCount).toBeGreaterThan(0);
    expect(typeof body.statistics.averageScore).toBe("number");
    expect(Array.isArray(body.brandRanking)).toBe(true);
    expect(body.brandRanking.length).toBeGreaterThan(0);
    expect(Array.isArray(body.insights)).toBe(true);
    expect(body.category).toBeNull();
  });

  it("inclui estatísticas da categoria quando categorySlug é informado", async () => {
    const { GET } = await import("../../src/app/api/market/route");
    const res = await GET(new Request("http://localhost/api/market?categorySlug=creatina"));

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.category).not.toBeNull();
    expect(body.category.categorySlug).toBe("creatina");
    expect(body.category.statistics.productCount).toBeGreaterThan(0);
    expect(Array.isArray(body.category.statistics.scoreDistribution)).toBe(true);
    expect(Array.isArray(body.category.insights)).toBe(true);
  });

  it("devolve category null para uma categoria sem avaliações reais", async () => {
    const { GET } = await import("../../src/app/api/market/route");
    const res = await GET(
      new Request("http://localhost/api/market?categorySlug=categoria-sem-produtos-avaliados"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.category).toBeNull();
  });
});
