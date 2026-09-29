import { prisma } from "../src/lib/db/prisma";

/**
 * Vitrine só com monetização real (docs/VITRINE_MONETIZAVEL_2026-09-29.md):
 * tira da vitrine os produtos sem comissão possível hoje, trocando
 * `status` PUBLISHED → UNPUBLISHED. Nada é apagado — SKU, PriceEntry,
 * ProductScore, OutboundClick e imagens ficam intactos; republicar é só
 * voltar o status.
 *
 * Dry-run por padrão; `--apply` grava. Só toca produto que ainda está
 * PUBLISHED (idempotente).
 *
 *   npx tsx prisma/unpublishNonMonetizable.ts [--apply]
 */
const SLUGS = [
  // BLOQUEADO (7)
  "max-titanium-mass-titanium-17500-3kg",
  "integralmedica-pre-treino-prime-md-300g",
  "max-titanium-egide-300g",
  "dark-lab-100-whey-protein-900g",
  "integralmedica-whey-protein-concentrado-900g",
  "max-titanium-100-whey-protein-900g",
  "soldiers-nutrition-whey-protein-concentrado-1kg",
  // AMBIGUO (4)
  "dux-creatina-300g",
  "integralmedica-creatina-creapure-300g",
  "vitafor-creatina-300g",
  "integralmedica-sinister-mass-3kg",
  // NAO (32)
  "integralmedica-protein-crisp-bar-caixa-12-un",
  "max-titanium-power-protein-bar-caixa-12-un-41g",
  "integralmedica-bcaa-2044mg-90-capsulas",
  "dux-cafeina-90-capsulas",
  "growth-cafeina-100mg-120-capsulas",
  "growth-cafeina-200mg-60-capsulas",
  "max-titanium-fire-black-60-capsulas",
  "growth-coenzima-q10-100mg-60-capsulas",
  "integralmedica-coq10-30-capsulas",
  "max-titanium-colagen-100-capsulas",
  "probiotica-pro-collagen-330g",
  "vitafor-colagentek-300g",
  "darkness-creatina-monohidratada-300g",
  "max-titanium-glutamina-lg-300g",
  "growth-melatonina-021mg-100-capsulas",
  "max-titanium-omega-3-90-capsulas",
  "vitafor-omega-3-epa-dha-120-capsulas",
  "growth-pasta-de-amendoim-integral-torrado-1kg",
  "nutrata-pasta-de-amendoim-pacoca-600g",
  "dux-pre-workout-original-300g",
  "probiotica-epic-pre-treino-300g",
  "adaptogen-tasty-whey-3w-900g",
  "bodyaction-body-whey-protein-900g",
  "darkness-dark-whey-protein-concentrado-900g",
  "dux-whey-protein-concentrado-900g",
  "new-millen-whey-100-900g",
  "nutrata-w100-whey-concentrado-900g",
  "optimum-nutrition-gold-standard-whey-907g",
  "probiotica-hiper-100-whey-900g",
  "vitafor-whey-protein-concentrado-900g",
  "growth-zma-ultra-120-comprimidos",
  "max-titanium-zma-90-capsulas",
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const found = await prisma.product.findMany({
    where: { slug: { in: [...SLUGS] } },
    select: { slug: true, status: true },
  });
  const missing = SLUGS.filter((s) => !found.some((p) => p.slug === s));
  if (missing.length) throw new Error(`slugs inexistentes: ${missing.join(", ")}`);

  const toChange = found.filter((p) => p.status === "PUBLISHED");
  console.warn(`${SLUGS.length} na lista, ${toChange.length} ainda PUBLISHED`);
  for (const p of toChange) console.warn(`  ${p.slug}`);

  if (!apply) {
    console.warn("dry-run — rode com --apply para gravar");
    return;
  }
  const { count } = await prisma.product.updateMany({
    where: { slug: { in: toChange.map((p) => p.slug) }, status: "PUBLISHED" },
    data: { status: "UNPUBLISHED" },
  });
  console.warn(`${count} produtos → UNPUBLISHED`);
  console.warn(
    `PUBLISHED restantes: ${await prisma.product.count({ where: { status: "PUBLISHED" } })}`,
  );
}

main().finally(() => prisma.$disconnect());
