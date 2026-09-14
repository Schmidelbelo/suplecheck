import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";
import { isTestSlug } from "@/lib/catalog/testDataGuard";
import { MIN_PRODUCTS_FOR_FILTER_PAGE } from "@/modules/category/components/CategoryFilterPage";

const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

// Mesmos 4 filtros de `CategoryFilterPage` — só listadas no sitemap
// quando a categoria já bate a regra editorial de volume mínimo (ver
// `docs/INVENTARIO_CONTEUDO_FUTURO.md`). `creatina` fica de fora daqui:
// suas 4 páginas (`/creatina/melhor-custo-beneficio` etc.) já entram em
// `sitemap-static.xml`, com rota própria.
const FILTER_SLUGS = [
  "melhor-custo-beneficio",
  "menor-preco-por-dose",
  "mais-vendidos",
  "mais-bem-avaliados",
] as const;

export const revalidate = 300;

export async function GET() {
  const allCategories = await prisma.category
    .findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    })
    .catch(() => []);
  // Nunca envia categoria de teste vazada no banco para o sitemap (ver
  // testDataGuard.ts) — limpeza real dos registros é feita à parte.
  const categories = allCategories.filter((category) => !isTestSlug(category.slug));

  const publishedCounts = await prisma.product
    .groupBy({
      by: ["categoryId"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    })
    .catch(() => []);
  const categoryRows = await prisma.category
    .findMany({ select: { id: true, slug: true } })
    .catch(() => []);
  const countBySlug = new Map<string, number>();
  for (const row of publishedCounts) {
    const category = categoryRows.find((c) => c.id === row.categoryId);
    if (category) countBySlug.set(category.slug, row._count._all);
  }

  const categoryUrls = categories.map((category) => {
    const path = CATEGORY_ROUTE_OVERRIDES[category.slug] ?? `/categorias/${category.slug}`;
    return `  <url><loc>${new URL(path, siteConfig.url).toString()}</loc><lastmod>${category.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.65</priority></url>`;
  });

  const filterUrls = categories
    .filter(
      (category) =>
        !CATEGORY_ROUTE_OVERRIDES[category.slug] &&
        (countBySlug.get(category.slug) ?? 0) >= MIN_PRODUCTS_FOR_FILTER_PAGE,
    )
    .flatMap((category) =>
      FILTER_SLUGS.map(
        (filterSlug) =>
          `  <url><loc>${new URL(`/categorias/${category.slug}/${filterSlug}`, siteConfig.url).toString()}</loc><lastmod>${category.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
      ),
    );

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...categoryUrls, ...filterUrls].join("\n")}\n</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
