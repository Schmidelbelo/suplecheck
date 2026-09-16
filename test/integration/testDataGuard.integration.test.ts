import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { isTestSlug } from "../../src/lib/catalog/testDataGuard";

/**
 * Guardrail contra o que motivou `docs/AUDITORIA_DADOS_TESTE.md`: um
 * teste de API/integração que cria dado real contra o Postgres de dev
 * (ver `test/setupTestContainer.ts`) e cai antes do `cleanup()`, deixando
 * um registro de teste com `status: PUBLISHED` vazado em produção.
 *
 * Não roda contra um banco isolado — é uma consulta real, com a MESMA
 * conexão (`DATABASE_URL`) usada pelo app, pelo motivo oposto de todo
 * outro teste: aqui queremos ver exatamente o que uma superfície pública
 * veria. Falhar aqui é o sinal de que `npm run archive:test-fixtures`
 * (ou, antes disso, a causa raiz — um teste que não limpou depois de si)
 * precisa rodar antes do próximo deploy.
 */
const client = new PrismaClient();

describe("guardrail — nenhum produto de teste publicado vaza em produção", () => {
  // Escopo deliberadamente restrito a Product (task: "falhar se produto
  // PUBLISHED tiver slug/nome de teste") — marca/categoria de teste
  // continuam existindo por decisão consciente (ver
  // docs/AUDITORIA_DADOS_TESTE.md §5, risco de remover > benefício
  // quando já protegidas em leitura por testDataGuard.ts em toda
  // superfície pública), então não viram falha de guardrail aqui.
  it("nenhum Product PUBLISHED/IN_REVIEW tem slug de teste", async () => {
    const leaked = await client.product.findMany({
      where: { status: { in: ["PUBLISHED", "IN_REVIEW"] } },
      select: { id: true, slug: true, name: true, status: true },
    });

    const testProducts = leaked.filter((p) => isTestSlug(p.slug));

    expect(
      testProducts,
      `${testProducts.length} produto(s) de teste com status PUBLISHED/IN_REVIEW encontrado(s): ` +
        `${testProducts.map((p) => `${p.slug} (${p.status})`).join(", ")}. ` +
        `Rode "DRY_RUN=0 npm run archive:test-fixtures" para arquivar.`,
    ).toEqual([]);
  });
});
