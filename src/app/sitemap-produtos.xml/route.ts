import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export async function GET() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", category: { slug: "creatina" } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return xmlResponse(
    urlset(
      products.map((product) => ({
        loc: new URL(`/creatina/${product.slug}`, siteConfig.url).toString(),
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
