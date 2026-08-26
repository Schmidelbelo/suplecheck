import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Sitemap dinâmico. Nesta fase lista apenas rotas estáticas conhecidas.
 * Quando o catálogo (Product/Category) existir no banco, este arquivo
 * passa a consultar o Prisma e concatenar as URLs geradas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/ranking", priority: 0.9, changeFrequency: "weekly" },
    { path: "/como-avaliamos", priority: 0.8, changeFrequency: "monthly" },
    { path: "/metodologia", priority: 0.8, changeFrequency: "monthly" },
    { path: "/sobre", priority: 0.6, changeFrequency: "monthly" },
    { path: "/como-ganhamos-dinheiro", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contato", priority: 0.5, changeFrequency: "yearly" },
    { path: "/privacidade", priority: 0.3, changeFrequency: "yearly" },
    { path: "/termos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  ];

  return staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
