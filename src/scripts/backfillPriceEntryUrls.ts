import { PrismaClient } from "@prisma/client";

/**
 * Reparo único de dado histórico — não um workaround do pipeline (que
 * já foi corrigido na origem em `PriceCaptureJobRunner.ts`/`steps.ts`).
 * Antes da correção, toda captura automática gravava `PriceEntry.url =
 * null`, mesmo quando uma URL real já era conhecida de uma captura
 * anterior — este script corrige as linhas MAIS RECENTES que ficaram
 * assim, usando a última URL real de verdade já registrada no histórico
 * do mesmo SKU (nunca inventa nem adivinha uma URL nova).
 *
 * Roda uma vez, contra o catálogo real: `npm run repair:price-urls`.
 * Idempotente — rodar de novo depois que o pipeline corrigido já
 * repovoou tudo não altera nada (não há mais nenhuma linha recente com
 * `url: null` cuja história tenha uma URL para herdar).
 */
async function main() {
  const prisma = new PrismaClient();

  try {
    const skus = await prisma.sku.findMany({
      select: {
        id: true,
        product: { select: { name: true, slug: true } },
        priceEntries: {
          orderBy: { capturedAt: "desc" },
          select: { id: true, url: true, capturedAt: true },
        },
      },
    });

    let repaired = 0;
    let alreadyOk = 0;
    let noHistoryToRepairFrom = 0;

    for (const sku of skus) {
      const [latest, ...older] = sku.priceEntries;
      if (!latest) continue;

      if (latest.url) {
        alreadyOk += 1;
        continue;
      }

      const lastKnownGoodUrl = older.find((entry) => entry.url)?.url ?? null;
      if (!lastKnownGoodUrl) {
        noHistoryToRepairFrom += 1;
        console.warn(
          `[repair:price-urls] ${sku.product.name} (${sku.product.slug}) — nenhuma URL em todo o histórico deste SKU, nada para reparar.`,
        );
        continue;
      }

      await prisma.priceEntry.update({
        where: { id: latest.id },
        data: { url: lastKnownGoodUrl },
      });
      repaired += 1;
      console.debug(
        `[repair:price-urls] ${sku.product.name} (${sku.product.slug}) — url reparada a partir do histórico: ${lastKnownGoodUrl}`,
      );
    }

    console.debug(
      `[repair:price-urls] concluído — ${repaired} reparada(s), ${alreadyOk} já corretas, ${noHistoryToRepairFrom} sem histórico para reparar.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[repair:price-urls] falhou", error);
  process.exit(1);
});
