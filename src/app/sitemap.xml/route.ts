import { siteConfig } from "@/config/site";

// Só sitemaps XML de verdade — um `<sitemapindex>` só pode listar
// `<sitemap>` apontando para outro documento de sitemap válido (protocolo
// sitemaps.org). `rss.xml` é um feed RSS, formato diferente; ele já é
// anunciado separadamente em `robots.ts` (campo `sitemap`, que aceita
// qualquer recurso de descoberta), não pertence aqui dentro.
const segmentedSitemaps = [
  "/sitemap-static.xml",
  "/sitemap-produtos.xml",
  "/sitemap-marcas.xml",
  "/sitemap-categorias.xml",
  "/sitemap-comparacoes.xml",
];

export const revalidate = 300;

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
