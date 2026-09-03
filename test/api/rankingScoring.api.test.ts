import { describe, it, expect } from "vitest";

/**
 * API Test — só leitura (`GET`), contra o ranking real de "creatina"
 * já semeado em produção/dev. Sem criação/limpeza de dado: verifica que
 * o enriquecimento de Score Geral e selos (Core Domain) chega correto
 * até a resposta HTTP, não a lógica de cálculo em si (já coberta pelos
 * testes unitários de `packages/core/src/domain/scoring`).
 */
describe("GET /api/evaluation/rankings/[categorySlug]/view — Score Geral e selos", () => {
  it("cada entrada tem overallScore, badges e criteriaScores; nenhum selo duplicado", async () => {
    const { GET } = await import("../../src/app/api/evaluation/rankings/[categorySlug]/view/route");
    const res = await GET(new Request("http://localhost/api/evaluation/rankings/creatina/view"), {
      params: Promise.resolve({ categorySlug: "creatina" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.entries.length).toBeGreaterThan(0);

    for (const entry of body.entries) {
      expect(typeof entry.overallScore).toBe("number");
      expect(entry.overallScore).toBeGreaterThanOrEqual(0);
      expect(entry.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(entry.badges)).toBe(true);
      expect(typeof entry.criteriaScores).toBe("object");
    }

    for (const label of [
      "Melhor Compra",
      "Melhor Avaliado",
      "Melhor Preço",
      "Maior Nota Geral",
      "Melhor Custo-Benefício",
    ]) {
      const winners = body.entries.filter((e: { badges: { label: string }[] }) =>
        e.badges.some((b) => b.label === label),
      );
      expect(winners.length).toBeLessThanOrEqual(1);
    }
  });
});
