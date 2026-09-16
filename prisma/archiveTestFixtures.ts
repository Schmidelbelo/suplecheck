import { PrismaClient } from "@prisma/client";
import { isTestSlug } from "../src/lib/catalog/testDataGuard";

/**
 * Arquiva (soft delete, nunca deleta) produtos de teste vazados no banco
 * real — registros criados por `test/api/*.test.ts` /
 * `test/integration/*.test.ts` que deveriam ter sido removidos no
 * `cleanup()`/`afterAll` de cada teste, mas sobreviveram porque o teste
 * caiu no meio (ex.: instabilidade de conexão com o Neon) antes de
 * chegar lá. Ver `docs/AUDITORIA_DADOS_TESTE.md` para a auditoria
 * completa que motivou este script.
 *
 * Escopo deliberadamente restrito a `Product`: marca/categoria de teste
 * ficam de fora (ver testDataGuard.ts para a proteção em tempo de leitura
 * que já as esconde de toda superfície pública) — arquivar/apagar
 * marca ou categoria é mais arriscado (podem, em teoria, já ter sido
 * referenciadas por um produto real criado manualmente depois; nenhuma
 * evidência disso hoje, mas o risco não vale a pena para um problema já
 * resolvido pelo filtro de leitura). Ver auditoria para a recomendação
 * completa.
 *
 * Nunca deleta a linha — muda `status` para `ARCHIVED`, o mesmo soft
 * delete usado em todo o resto da aplicação (Domain Model §3.1,
 * `DeleteSupplementUseCase`). Idempotente: rodar de novo depois que um
 * produto já está `ARCHIVED` não faz nada (ele já não está mais na
 * lista de `PUBLISHED`/`DRAFT`/`IN_REVIEW` correspondida abaixo).
 *
 * `DRY_RUN=1` (padrão) só imprime o que faria. `DRY_RUN=0 npm run
 * archive:test-fixtures` executa de verdade.
 */
async function main() {
  const dryRun = process.env.DRY_RUN !== "0";
  const prisma = new PrismaClient();

  try {
    const candidates = await prisma.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        brand: { select: { slug: true, name: true } },
        category: { select: { slug: true, name: true } },
      },
    });

    const testProducts = candidates.filter((p) => isTestSlug(p.slug));

    if (testProducts.length === 0) {
      console.log(
        "[archive:test-fixtures] nenhum produto de teste PUBLISHED/DRAFT/IN_REVIEW/UNPUBLISHED encontrado — nada a fazer.",
      );
      return;
    }

    console.log(
      `[archive:test-fixtures] ${dryRun ? "DRY RUN — nenhuma escrita será feita" : "EXECUÇÃO REAL"}`,
    );
    console.log(
      `[archive:test-fixtures] ${testProducts.length} produto(s) de teste encontrado(s):\n`,
    );

    for (const product of testProducts) {
      console.log(
        `  - ${product.name} (slug: ${product.slug})\n` +
          `    marca: ${product.brand.name} (${product.brand.slug}) · categoria: ${product.category.name} (${product.category.slug})\n` +
          `    status: ${product.status} -> ARCHIVED`,
      );

      if (!dryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "ARCHIVED" },
        });
        await prisma.auditLog.create({
          data: {
            actorType: "SYSTEM",
            action: "test_fixture.archived",
            entityType: "product",
            entityId: product.id,
            metadata: {
              slug: product.slug,
              from: product.status,
              to: "ARCHIVED",
              reason: "dado de teste vazado no banco real — ver docs/AUDITORIA_DADOS_TESTE.md",
            },
          },
        });
      }
    }

    console.log(
      `\n[archive:test-fixtures] ${dryRun ? "simulação concluída — rode com DRY_RUN=0 para aplicar" : "concluído — " + testProducts.length + " produto(s) arquivado(s)"}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[archive:test-fixtures] falhou", error);
  process.exit(1);
});
