import { siteConfig } from "@/config/site";

const articles = [
  {
    path: "/artigos/melhor-creatina-custo-beneficio-2026",
    title: "Melhor Creatina Custo-Benefício em 2026",
    description: "Como comparar creatinas pelo preço por dose, nota e transparência do rótulo.",
  },
  {
    path: "/artigos/como-comparar-whey-protein-corretamente",
    title: "Como comparar Whey Protein corretamente",
    description:
      "Um método simples para comparar whey protein por proteína, porção, preço e custo-benefício.",
  },
  {
    path: "/artigos/pre-treino-o-que-importa-antes-de-comprar",
    title: "Pré-Treino: o que realmente importa antes de comprar",
    description: "O que observar na fórmula, na dose e no custo antes de escolher um pré-treino.",
  },
] as const;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const now = new Date().toUTCString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escapeXml(siteConfig.name)}</title>
<link>${escapeXml(siteConfig.url)}</link>
<description>${escapeXml(siteConfig.description)}</description>
<language>pt-BR</language>
<lastBuildDate>${now}</lastBuildDate>
${articles
  .map((article) => {
    const url = new URL(article.path, siteConfig.url).toString();
    return `<item>
<title>${escapeXml(article.title)}</title>
<link>${escapeXml(url)}</link>
<guid>${escapeXml(url)}</guid>
<description>${escapeXml(article.description)}</description>
<pubDate>${now}</pubDate>
</item>`;
  })
  .join("\n")}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
