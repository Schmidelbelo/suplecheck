import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Sitemap dinâmico. Nesta fase lista apenas rotas estáticas conhecidas.
 * Quando o catálogo (Product/Category) existir no banco, este arquivo
 * passa a consultar o Prisma e concatenar as URLs geradas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/categorias", "/comparar", "/artigos", "/sobre"];

  return staticRoutes.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
