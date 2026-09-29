import { prisma } from "../src/lib/db/prisma";

/**
 * Recaptura 2026-09-29 (docs/RECAPTURA_PRECOS_VITRINE_2026-09-29.md):
 * estes ASINs estão "Não disponível" na Amazon, sem oferta em destaque e
 * sem nenhum outro vendedor — não há preço real para recapturar e o
 * clique leva a uma página sem compra possível. Saem da vitrine
 * (PUBLISHED → UNPUBLISHED), sem apagar nada; voltam quando o ASIN tiver
 * oferta de novo e o preço for recapturado.
 *
 * Dry-run por padrão; `--apply` grava.
 */
const SLUGS = [
  "integralmedica-omega-3-1360mg-60-capsulas", // B081VQZ1YK
  "growth-creatina-monohidratada-250g", // B0CJG32CZ6
  "growth-whey-protein-concentrado-900g", // B0H8LTG86T
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const found = await prisma.product.findMany({
    where: { slug: { in: [...SLUGS] }, status: "PUBLISHED" },
    select: { slug: true },
  });
  for (const p of found) console.warn(`  ${p.slug}`);
  if (!apply) {
    console.warn(`${found.length} ainda PUBLISHED — dry-run, rode com --apply para gravar`);
    return;
  }
  const { count } = await prisma.product.updateMany({
    where: { slug: { in: found.map((p) => p.slug) }, status: "PUBLISHED" },
    data: { status: "UNPUBLISHED" },
  });
  console.warn(`${count} produtos → UNPUBLISHED`);
  console.warn(
    `PUBLISHED restantes: ${await prisma.product.count({ where: { status: "PUBLISHED" } })}`,
  );
}

main().finally(() => prisma.$disconnect());
