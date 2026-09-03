import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

export const revalidate = 300;

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${categories
      .map((category) => {
        const path = CATEGORY_ROUTE_OVERRIDES[category.slug] ?? `/categorias/${category.slug}`;
        return `  <url><loc>${new URL(path, siteConfig.url).toString()}</loc><lastmod>${category.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.65</priority></url>`;
      })
      .join("\n")}\n</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
