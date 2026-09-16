import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";
import { isTestSlug } from "@/lib/catalog/testDataGuard";

export const revalidate = 300;

export async function GET() {
  const activeBrands = await prisma.brand
    .findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    })
    .catch(() => []);

  // Nunca envia marca de teste vazada no banco para o sitemap (ver
  // testDataGuard.ts) — mesma proteção já aplicada em sitemap-categorias.xml.
  const brands = activeBrands.filter((brand) => !isTestSlug(brand.slug));

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${brands
      .map(
        (brand) =>
          `  <url><loc>${new URL(`/marcas/${brand.slug}`, siteConfig.url).toString()}</loc><lastmod>${brand.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.65</priority></url>`,
      )
      .join("\n")}\n</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
