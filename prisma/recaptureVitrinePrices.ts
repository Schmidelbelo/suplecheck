import { prisma } from "../src/lib/db/prisma";

/**
 * Recaptura de preço dos produtos visíveis/monetizados antes de tráfego
 * pago (docs/RECAPTURA_PRECOS_VITRINE_2026-09-29.md). Preços lidos em
 * 2026-09-29 na listagem de ofertas da Amazon (`aodAjaxMain`) de cada
 * ASIN — oferta em destaque quando existe; quando a página não tem
 * oferta em destaque mas há vendedores, a menor oferta "Novo".
 *
 * Append-only: cria uma `PriceEntry` nova por produto reaproveitando
 * `url`/`affiliateUrl`/`storeId` da captura atual — só preço e
 * disponibilidade mudam. Aborta o produto se a captura atual não for
 * mais o ASIN esperado (nunca grava preço de um produto em outro).
 *
 *   npx tsx prisma/recaptureVitrinePrices.ts [--apply]
 */
const RECAPTURES: readonly { slug: string; asin: string; priceCents: number }[] = [
  { slug: "max-titanium-bcaa-2400-100-capsulas", asin: "B076X8666Y", priceCents: 5199 },
  { slug: "atlhetica-creatina-300g", asin: "B07MPZLM1N", priceCents: 3816 },
  { slug: "black-skull-creatina-300g", asin: "B09MJK3PMB", priceCents: 2840 },
  { slug: "max-titanium-creatina-300g", asin: "B07DVJC66X", priceCents: 3337 },
  { slug: "optimum-nutrition-creatine-300g", asin: "B07774XR8W", priceCents: 8721 },
  { slug: "probiotica-creatina-300g", asin: "B07G7JPTCV", priceCents: 3809 },
  { slug: "integralmedica-glutamina-300g", asin: "B07L5X6FSQ", priceCents: 4990 },
  { slug: "neo-quimica-melatonina-021mg-90-comprimidos", asin: "B0B5S7L3VN", priceCents: 1500 },
  { slug: "darkness-evora-pw-limao-150g", asin: "B09C81ML7Z", priceCents: 5944 },
  { slug: "max-titanium-horus-300g", asin: "B09B1B9QBP", priceCents: 7504 },
  // Sem oferta em destaque — menor oferta "Novo" da listagem.
  { slug: "probiotica-100-pure-whey-900g", asin: "B0BKQSX5CF", priceCents: 14773 },
  { slug: "black-skull-whey-protein-concentrado-900g", asin: "B0G6WYK4B3", priceCents: 17090 },
];

async function main() {
  const apply = process.argv.includes("--apply");
  let written = 0;

  for (const r of RECAPTURES) {
    const product = await prisma.product.findUnique({
      where: { slug: r.slug },
      select: {
        status: true,
        skus: {
          where: { status: "ACTIVE" },
          take: 1,
          select: {
            id: true,
            priceEntries: {
              orderBy: { capturedAt: "desc" },
              take: 1,
              select: {
                storeId: true,
                url: true,
                affiliateUrl: true,
                priceCents: true,
                store: { select: { slug: true } },
              },
            },
          },
        },
      },
    });
    const sku = product?.skus[0];
    const current = sku?.priceEntries[0];
    if (product?.status !== "PUBLISHED" || !sku || !current?.url) {
      console.warn(`PULADO ${r.slug}: não publicado ou sem oferta atual`);
      continue;
    }
    if (current.store.slug !== "amazon-br" || !current.url.includes(`/dp/${r.asin}`)) {
      console.warn(`PULADO ${r.slug}: oferta atual não é amazon-br/dp/${r.asin} (${current.url})`);
      continue;
    }

    console.warn(`${r.slug}: ${current.priceCents} → ${r.priceCents}`);
    if (!apply) continue;
    await prisma.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: current.storeId,
        priceCents: r.priceCents,
        currency: "BRL",
        url: current.url,
        affiliateUrl: current.affiliateUrl,
        availability: "IN_STOCK",
      },
    });
    written++;
  }

  console.warn(apply ? `${written} capturas gravadas` : "dry-run — rode com --apply para gravar");
}

main().finally(() => prisma.$disconnect());
