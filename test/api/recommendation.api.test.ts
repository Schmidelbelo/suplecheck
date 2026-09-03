import { describe, it, expect } from "vitest";

/**
 * `/api/recommendation` é somente leitura sobre os dados reais de
 * creatina já existentes (seed) — sem criar nem limpar dados, no
 * mesmo espírito de `test/api/market.api.test.ts`.
 */
describe("API /api/recommendation", () => {
  it("recomenda um produto real dentro do orçamento sob a prioridade economia", async () => {
    const { GET } = await import("../../src/app/api/recommendation/route");
    const res = await GET(
      new Request(
        "http://localhost/api/recommendation?goal=ganho-de-massa&priority=economy&budget=70",
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.categorySlug).toBe("creatina");
    expect(body.recommended).not.toBeNull();
    expect(body.recommended.priceCents).toBeLessThanOrEqual(7000);
    expect(body.weightsUsed.price).toBeGreaterThan(0);
    expect(Array.isArray(body.ranking)).toBe(true);
    expect(body.ranking.length).toBeGreaterThan(0);
  });

  it("devolve pesos diferentes conforme a prioridade escolhida", async () => {
    const { GET } = await import("../../src/app/api/recommendation/route");
    const economyRes = await GET(
      new Request("http://localhost/api/recommendation?goal=ganho-de-massa&priority=economy"),
    );
    const qualityRes = await GET(
      new Request("http://localhost/api/recommendation?goal=ganho-de-massa&priority=bestRating"),
    );

    const economy = await economyRes.json();
    const quality = await qualityRes.json();

    expect(economy.weightsUsed.quality).toBeLessThan(quality.weightsUsed.quality);
  });

  it("inclui vantagens e desvantagens reais no produto recomendado", async () => {
    const { GET } = await import("../../src/app/api/recommendation/route");
    const res = await GET(
      new Request("http://localhost/api/recommendation?goal=ganho-de-massa&priority=costBenefit"),
    );
    const body = await res.json();

    expect(Array.isArray(body.recommended.topAdvantages)).toBe(true);
    expect(body.recommended.topAdvantages.length).toBeGreaterThan(0);
  });

  it("retorna 404 para um objetivo sem categoria mapeada", async () => {
    const { GET } = await import("../../src/app/api/recommendation/route");
    const res = await GET(
      new Request("http://localhost/api/recommendation?goal=objetivo-sem-categoria-real"),
    );

    expect(res.status).toBe(404);
  });
});
