import { prisma } from "../src/lib/db/prisma";

/**
 * Migração única da política antiga (card ilustrativo gerado) para a
 * nova (fila humana) — enfileira todo produto publicado que hoje está
 * com card em `/public/products/*-card.webp` em `PendingImage`, com o
 * motivo real documentado nas sprints anteriores. Idempotente (upsert
 * por `productId`) — seguro rodar de novo.
 */

const CLOUDFLARE_BLOCKED_REASON =
  'Site oficial bloqueia scraping automatizado (Cloudflare, resposta 403 "Just a moment") — precisa de imagem enviada manualmente.';
const WEIGHT_MISMATCH_REASON =
  "Peso/variante cadastrado no catálogo não corresponde a nenhum SKU real encontrado nas buscas — confirme o dado antes de anexar imagem.";
const NOT_FOUND_REASON =
  "Nenhuma fotografia pública de embalagem encontrada nas fontes pesquisadas.";

const REASON_OVERRIDES: Record<string, string> = {
  "growth-creatina-monohidratada-300g": WEIGHT_MISMATCH_REASON,
  "atlhetica-creatina-300g": WEIGHT_MISMATCH_REASON,
  "nutrata-creatina-creapure-250g": WEIGHT_MISMATCH_REASON,
  "max-titanium-creatina-300g": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-100-whey-protein-900g": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-mass-titanium-17500-3kg": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-egide-300g": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-fire-black-60-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-bcaa-2400-100-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-zma-90-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-glutamina-lg-300g": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-power-protein-bar-caixa-12-un-41g": CLOUDFLARE_BLOCKED_REASON,
  "max-titanium-omega-3-90-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "integralmedica-creatina-creapure-300g": CLOUDFLARE_BLOCKED_REASON,
  "integralmedica-omega-3-1360mg-60-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "integralmedica-pre-treino-prime-md-300g": CLOUDFLARE_BLOCKED_REASON,
  "integralmedica-coq10-30-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "integralmedica-bcaa-2044mg-90-capsulas": CLOUDFLARE_BLOCKED_REASON,
  "integralmedica-sinister-mass-3kg": CLOUDFLARE_BLOCKED_REASON,
  "probiotica-100-pure-whey-900g": CLOUDFLARE_BLOCKED_REASON,
  "probiotica-hiper-100-whey-900g": CLOUDFLARE_BLOCKED_REASON,
  "probiotica-creatina-300g": CLOUDFLARE_BLOCKED_REASON,
  "probiotica-pro-collagen-330g": CLOUDFLARE_BLOCKED_REASON,
  "probiotica-epic-pre-treino-300g": CLOUDFLARE_BLOCKED_REASON,
};

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      images: { where: { role: "COVER" }, select: { url: true } },
    },
  });

  let queued = 0;
  for (const p of products) {
    if (p.category.slug.startsWith("price-stats-")) continue; // dado de teste
    const url = p.images[0]?.url ?? "";
    if (!url.includes("card")) continue; // já tem imagem real, não entra na fila

    await prisma.pendingImage.upsert({
      where: { productId: p.id },
      create: {
        productId: p.id,
        productName: p.name,
        brandName: p.brand.name,
        categoryName: p.category.name,
        reason: REASON_OVERRIDES[p.slug] ?? NOT_FOUND_REASON,
      },
      update: { reason: REASON_OVERRIDES[p.slug] ?? NOT_FOUND_REASON },
    });
    queued++;
  }
  console.warn(`Produtos enfileirados na Central de Imagens: ${queued}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
