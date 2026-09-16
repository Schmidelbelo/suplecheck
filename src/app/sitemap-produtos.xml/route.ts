import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";
import { productDetailPath } from "@/lib/catalog/productRoutes";
import { isTestSlug } from "@/lib/catalog/testDataGuard";

export const revalidate = 300;

export async function GET() {
  // Nunca derruba o build/deploy por instabilidade do banco no momento
  // do prerender — um sitemap vazio momentaneamente é preferível a
  // travar o deploy inteiro (o próximo `revalidate` corrige sozinho).
  const publishedProducts = await prisma.product
    .findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
      orderBy: { updatedAt: "desc" },
    })
    .catch(() => []);

  // Defesa em profundidade contra dados de teste vazados no banco real
  // ficando PUBLISHED (ver testDataGuard.ts) — a limpeza real já
  // arquiva esses registros, este filtro cobre o intervalo entre um
  // teste vazar e o próximo arquivamento rodar.
  const products = publishedProducts.filter(
    (product) => !isTestSlug(product.slug) && !isTestSlug(product.category.slug),
  );

  return xmlResponse(
    urlset(
      products.map((product) => ({
        loc: new URL(
          productDetailPath(product.category.slug, product.slug),
          siteConfig.url,
        ).toString(),
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
