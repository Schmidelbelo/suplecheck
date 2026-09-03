import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/conta/", "/admin/"],
      },
    ],
    sitemap: [
      new URL("/sitemap.xml", siteConfig.url).toString(),
      new URL("/sitemap-produtos.xml", siteConfig.url).toString(),
      new URL("/sitemap-marcas.xml", siteConfig.url).toString(),
      new URL("/sitemap-categorias.xml", siteConfig.url).toString(),
      new URL("/sitemap-comparacoes.xml", siteConfig.url).toString(),
    ],
  };
}
