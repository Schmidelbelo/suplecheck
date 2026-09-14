import { prisma } from "../src/lib/db/prisma";
import { discoverProductImageCandidate } from "../src/modules/media/services/productImage.service";

/**
 * FASE 1 — Descoberta, para todos os produtos publicados sem
 * `ProductImage` real ainda. Roda sem Blob nenhum: só popula
 * `PendingImage` com o candidato encontrado (ou o motivo). Passe
 * `RETRY_ALL=1` pra reprocessar produtos que já foram tentados antes
 * (útil depois de adicionar `imageSourceUrl` extra a um produto).
 */
async function main() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      attributes: true,
      brand: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      images: { where: { role: "COVER" }, select: { url: true } },
    },
  });

  let approved = 0;
  let rejected = 0;
  let pending = 0;
  let skipped = 0;

  for (const p of products) {
    if (p.category.slug.startsWith("price-stats-")) {
      skipped++;
      continue;
    }
    const url = p.images[0]?.url ?? "";
    const hasRealImage = url && !url.includes("card") && !url.includes("placeholder");
    if (hasRealImage) {
      skipped++;
      continue;
    }

    const attrs = (p.attributes as Record<string, unknown> | null) ?? {};
    const sourceUrl =
      (attrs.sourceUrl as string | undefined) ?? (attrs.imageSourceUrl as string | undefined);

    const result = await discoverProductImageCandidate({
      productId: p.id,
      productName: p.name,
      brandName: p.brand.name,
      categoryName: p.category.name,
      sourceUrl,
    });

    if (result.status === "APPROVED") approved++;
    else if (result.status === "REJECTED") rejected++;
    else pending++;

    console.warn(
      `[${result.status}]${result.confidence != null ? ` (${result.confidence.toFixed(2)})` : ""} ${p.slug}`,
    );
  }

  console.warn(
    `\nResumo Fase 1: ${approved} aprovados, ${rejected} rejeitados (confiança baixa), ${pending} sem candidato, ${skipped} já tinham imagem real.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
