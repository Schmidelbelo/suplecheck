import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  });

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
