import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/go/` nunca teve página própria (é só o Route Handler de redirect
        // que grava OutboundClick) — não indexa nada e não deve gastar
        // orçamento de rastreamento nem aparecer em logs de crawler.
        disallow: ["/api/", "/conta/", "/admin/", "/go/"],
      },
    ],
    sitemap: [
      new URL("/sitemap.xml", siteConfig.url).toString(),
      new URL("/sitemap-static.xml", siteConfig.url).toString(),
      new URL("/sitemap-produtos.xml", siteConfig.url).toString(),
      new URL("/sitemap-marcas.xml", siteConfig.url).toString(),
      new URL("/sitemap-categorias.xml", siteConfig.url).toString(),
      new URL("/sitemap-comparacoes.xml", siteConfig.url).toString(),
      new URL("/rss.xml", siteConfig.url).toString(),
    ],
  };
}
