import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";

/**
 * Métricas de monetização (cliques de saída) — protegido em
 * `src/middleware.ts` (todo `/api/admin/*`, inclusive GET). Lê
 * exclusivamente de `OutboundClick`, que já é gravado a cada redirect
 * real (`src/modules/monetization/services/outboundClick.service.ts`).
 * Não existe rastreamento de impressão/visualização de ranking ou
 * categoria hoje — por isso não há CTR aqui: um CTR inventado sem
 * denominador real seria um dado fabricado, o que este projeto nunca
 * faz. `topProducts`/`storesWithoutClicks`/`productsWithoutClicks` são
 * limitados para não escanear o catálogo inteiro a cada carregamento.
 */
export async function GET() {
  try {
    const [totalClicks, affiliateClicks, byStoreRaw, byProductRaw, byCategoryRaw, allStores] =
      await Promise.all([
        prisma.outboundClick.count(),
        prisma.outboundClick.count({ where: { wasAffiliate: true } }),
        prisma.outboundClick.groupBy({
          by: ["storeId"],
          _count: { _all: true },
          orderBy: { _count: { storeId: "desc" } },
        }),
        prisma.outboundClick.groupBy({
          by: ["productId"],
          _count: { _all: true },
          orderBy: { _count: { productId: "desc" } },
          take: 50,
        }),
        prisma.outboundClick.groupBy({
          by: ["categoryId"],
          _count: { _all: true },
          orderBy: { _count: { categoryId: "desc" } },
        }),
        prisma.store.findMany({
          where: { active: true },
          select: { id: true, name: true, slug: true, isAffiliate: true },
        }),
      ]);

    const storeIds = byStoreRaw.map((r) => r.storeId);
    const productIds = byProductRaw.map((r) => r.productId);
    const categoryIds = byCategoryRaw.map((r) => r.categoryId);

    const [stores, productRows, categories, clickedProductCount, activeProductCount] =
      await Promise.all([
        prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, slug: true },
        }),
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            category: { select: { slug: true, name: true } },
          },
        }),
        prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, slug: true },
        }),
        prisma.outboundClick.findMany({ distinct: ["productId"], select: { productId: true } }),
        prisma.product.count({ where: { status: "PUBLISHED" } }),
      ]);

    const storeNameById = new Map(stores.map((s) => [s.id, s]));
    const categoryNameById = new Map(categories.map((c) => [c.id, c]));
    const productById = new Map(productRows.map((p) => [p.id, p]));

    const byStore = byStoreRaw.map((r) => ({
      storeId: r.storeId,
      storeName: storeNameById.get(r.storeId)?.name ?? "(loja removida)",
      storeSlug: storeNameById.get(r.storeId)?.slug ?? null,
      clicks: r._count._all,
    }));

    const byProduct = byProductRaw.map((r) => ({
      productId: r.productId,
      productName: productById.get(r.productId)?.name ?? "(produto removido)",
      productSlug: productById.get(r.productId)?.slug ?? null,
      categorySlug: productById.get(r.productId)?.category.slug ?? null,
      clicks: r._count._all,
    }));

    const byCategory = byCategoryRaw.map((r) => ({
      categoryId: r.categoryId,
      categoryName: categoryNameById.get(r.categoryId)?.name ?? "(categoria removida)",
      categorySlug: categoryNameById.get(r.categoryId)?.slug ?? null,
      clicks: r._count._all,
    }));

    const clickedProductIds = new Set(clickedProductCount.map((c) => c.productId));
    const clickedStoreIds = new Set(storeIds);
    const storesWithoutClicks = allStores
      .filter((s) => s.isAffiliate && !clickedStoreIds.has(s.id))
      .map((s) => ({ storeId: s.id, storeName: s.name, storeSlug: s.slug }));

    // Produtos publicados sem nenhum clique registrado — limitado a 100
    // para não devolver o catálogo inteiro numa única resposta.
    const productsWithoutClicks = await prisma.product.findMany({
      where: { status: "PUBLISHED", id: { notIn: [...clickedProductIds] } },
      select: { id: true, name: true, slug: true, category: { select: { slug: true } } },
      take: 100,
    });

    return NextResponse.json({
      totalClicks,
      affiliateClicks,
      nonAffiliateClicks: totalClicks - affiliateClicks,
      distinctProductsWithClicks: clickedProductIds.size,
      publishedProductCount: activeProductCount,
      byStore,
      byProduct,
      byCategory,
      storesWithoutClicks,
      productsWithoutClicks: productsWithoutClicks.map((p) => ({
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        categorySlug: p.category.slug,
      })),
      ctrNote:
        "CTR por ranking/categoria não é exibido: não existe rastreamento de impressão (visualização de card) hoje, só de clique. Um CTR sem denominador real seria um número inventado.",
    });
  } catch (error) {
    console.error("[api/admin/metrics] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
