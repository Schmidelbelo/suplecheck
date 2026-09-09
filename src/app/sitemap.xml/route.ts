import { siteConfig } from "@/config/site";

const segmentedSitemaps = [
  "/sitemap-static.xml",
  "/sitemap-produtos.xml",
  "/sitemap-marcas.xml",
  "/sitemap-categorias.xml",
  "/sitemap-comparacoes.xml",
  "/rss.xml",
];

export async function GET() {
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${segmentedSitemaps
  .map(
    (path) => `<sitemap>
<loc>${new URL(path, siteConfig.url).toString()}</loc>
<lastmod>${now}</lastmod>
</sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
