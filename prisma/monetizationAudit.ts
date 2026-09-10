import { prisma } from "../src/lib/db/prisma";

/**
 * Sprint de Monetização — auditoria: replica exatamente a lógica de
 * `resolveOutboundClick` (1º SKU ACTIVE, price entry mais recente) para
 * determinar, produto a produto, se o clique em "Ver Oferta" hoje sai
 * monetizado ou não. Não escreve nada — apenas leitura e relatório.
 */

interface Row {
  productId: string;
  productName: string;
  categorySlug: string;
  storeSlug: string | null;
  isAffiliate: boolean;
  hasBaseUrl: boolean;
  monetized: boolean;
  priceCents: number | null;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      category: { select: { slug: true, name: true } },
      skus: {
        where: { status: "ACTIVE" },
        take: 1,
        select: {
          priceEntries: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: {
              priceCents: true,
              store: { select: { slug: true, isAffiliate: true, affiliateBaseUrl: true } },
            },
          },
        },
      },
    },
  });

  const rows: Row[] = products.map((p) => {
    const entry = p.skus[0]?.priceEntries[0];
    const store = entry?.store;
    const monetized = !!(store?.isAffiliate && store?.affiliateBaseUrl);
    return {
      productId: p.id,
      productName: p.name,
      categorySlug: p.category.slug,
      storeSlug: store?.slug ?? null,
      isAffiliate: store?.isAffiliate ?? false,
      hasBaseUrl: !!store?.affiliateBaseUrl,
      monetized,
      priceCents: entry?.priceCents ?? null,
    };
  });

  const total = rows.length;
  const monetized = rows.filter((r) => r.monetized);
  const notMonetized = rows.filter((r) => !r.monetized);

  console.warn(`\n=== RESUMO ===`);
  console.warn(`Total de produtos publicados: ${total}`);
  console.warn(`Monetizados (link de afiliado real): ${monetized.length}`);
  console.warn(`Não monetizados: ${notMonetized.length}`);
  console.warn(`Percentual monetizado: ${((monetized.length / total) * 100).toFixed(1)}%`);

  console.warn(`\n=== POR LOJA (produtos NÃO monetizados) ===`);
  const byStore: Record<string, number> = {};
  for (const r of notMonetized) {
    const key = r.storeSlug ?? "SEM_OFERTA";
    byStore[key] = (byStore[key] ?? 0) + 1;
  }
  for (const [store, count] of Object.entries(byStore).sort((a, b) => b[1] - a[1])) {
    console.warn(`${store.padEnd(30)} ${count}`);
  }

  console.warn(`\n=== POR CATEGORIA (receita potencial = soma de preços monetizados) ===`);
  const byCategory: Record<
    string,
    { total: number; monetized: number; revenuePotentialCents: number }
  > = {};
  for (const r of rows) {
    if (!byCategory[r.categorySlug])
      byCategory[r.categorySlug] = { total: 0, monetized: 0, revenuePotentialCents: 0 };
    byCategory[r.categorySlug].total++;
    if (r.monetized) {
      byCategory[r.categorySlug].monetized++;
      byCategory[r.categorySlug].revenuePotentialCents += r.priceCents ?? 0;
    }
  }
  for (const [cat, info] of Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total)) {
    console.warn(
      `${cat.padEnd(20)} total=${info.total} monetizados=${info.monetized} valorMonetizadoR$=${(info.revenuePotentialCents / 100).toFixed(2)}`,
    );
  }

  console.warn(`\n=== PRODUTOS SEM MONETIZAÇÃO (lista completa) ===`);
  for (const r of notMonetized) {
    console.warn(
      `[${r.categorySlug}] ${r.productName} — loja: ${r.storeSlug ?? "SEM OFERTA CADASTRADA"}`,
    );
  }

  console.warn(`\n=== TOP 20 POR POTENCIAL DE CLIQUE (preço monetizado, desc) ===`);
  const top20 = [...monetized]
    .sort((a, b) => (b.priceCents ?? 0) - (a.priceCents ?? 0))
    .slice(0, 20);
  top20.forEach((r, i) => {
    console.warn(
      `${i + 1}. [${r.categorySlug}] ${r.productName} — R$ ${((r.priceCents ?? 0) / 100).toFixed(2)} via ${r.storeSlug}`,
    );
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
