import { siteConfig } from "@/config/site";

const staticRoutes = [
  { path: "", priority: "1", changefreq: "weekly" },
  { path: "/creatina", priority: "0.9", changefreq: "daily" },
  { path: "/ranking", priority: "0.9", changefreq: "daily" },
  { path: "/artigos", priority: "0.8", changefreq: "weekly" },
  { path: "/artigos/melhor-creatina-custo-beneficio-2026", priority: "0.8", changefreq: "monthly" },
  { path: "/artigos/como-comparar-whey-protein-corretamente", priority: "0.8", changefreq: "monthly" },
  { path: "/artigos/pre-treino-o-que-importa-antes-de-comprar", priority: "0.8", changefreq: "monthly" },
  { path: "/marcas", priority: "0.8", changefreq: "daily" },
  { path: "/categorias", priority: "0.8", changefreq: "daily" },
  { path: "/ofertas", priority: "0.8", changefreq: "daily" },
  { path: "/como-avaliamos", priority: "0.8", changefreq: "monthly" },
  { path: "/metodologia", priority: "0.8", changefreq: "monthly" },
  { path: "/sobre", priority: "0.6", changefreq: "monthly" },
  { path: "/como-ganhamos-dinheiro", priority: "0.5", changefreq: "monthly" },
  { path: "/confianca", priority: "0.6", changefreq: "monthly" },
  { path: "/missao", priority: "0.5", changefreq: "monthly" },
  { path: "/politica-editorial", priority: "0.4", changefreq: "monthly" },
  { path: "/politica-de-correcoes", priority: "0.4", changefreq: "monthly" },
  { path: "/fontes", priority: "0.4", changefreq: "monthly" },
  { path: "/independencia-editorial", priority: "0.4", changefreq: "monthly" },
  { path: "/aviso-medico", priority: "0.4", changefreq: "monthly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/contato", priority: "0.5", changefreq: "yearly" },
  { path: "/privacidade", priority: "0.3", changefreq: "yearly" },
  { path: "/termos", priority: "0.3", changefreq: "yearly" },
  { path: "/cookies", priority: "0.3", changefreq: "yearly" },
];

export async function GET() {
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    ({ path, priority, changefreq }) => `<url>
<loc>${new URL(path, siteConfig.url).toString()}</loc>
<lastmod>${now}</lastmod>
<changefreq>${changefreq}</changefreq>
<priority>${priority}</priority>
</url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
