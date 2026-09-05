import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

/**
 * Rota de detalhe por categoria — hoje só `creatina` tem página própria
 * (`/creatina/[slug]`); qualquer outra categoria publicada usa a rota
 * genérica `/categorias/[slug]` até ganhar (se ganhar) uma rota própria.
 * Único lugar do sitemap que precisa saber dessa exceção — nunca
 * assumir silenciosamente que só existe uma categoria.
 */
const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

function productPath(categorySlug: string, productSlug: string): string {
  const base = CATEGORY_ROUTE_OVERRIDES[categorySlug] ?? `/categorias/${categorySlug}`;
  return `${base}/${productSlug}`;
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return xmlResponse(
    urlset(
      products.map((product) => ({
        loc: new URL(productPath(product.category.slug, product.slug), siteConfig.url).toString(),
        lastmod: product.updatedAt,
        changefreq: "weekly",
        priority: "0.7",
      })),
    ),
  );
}

function xmlResponse(body: string): Response {
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}

function urlset(entries: { loc: string; lastmod: Date; changefreq: string; priority: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      (entry) =>
        `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod.toISOString()}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
    )
    .join("\n")}\n</urlset>`;
}
