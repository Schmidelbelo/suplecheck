import { siteConfig } from "@/config/site";
import { listComparisonSitemapEntries } from "@/modules/comparison/services/comparisonPage.service";

export const revalidate = 300;

export async function GET() {
  const entries = await listComparisonSitemapEntries();

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
      .map(
        (entry) =>
          `  <url><loc>${new URL(`/comparar/${entry.pair}`, siteConfig.url).toString()}</loc><lastmod>${entry.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
      )
      .join("\n")}\n</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
