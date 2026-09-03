import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Sitemap principal com as rotas institucionais e os sitemaps segmentados.
 * Produtos, marcas, categorias e comparações ficam separados para crescerem
 * sem tornar este arquivo um gargalo conforme o catálogo aumenta.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/creatina", priority: 0.9, changeFrequency: "daily" },
    { path: "/marcas", priority: 0.8, changeFrequency: "daily" },
    { path: "/categorias", priority: 0.8, changeFrequency: "daily" },
    { path: "/ofertas", priority: 0.8, changeFrequency: "daily" },
    { path: "/como-avaliamos", priority: 0.8, changeFrequency: "monthly" },
    { path: "/metodologia", priority: 0.8, changeFrequency: "monthly" },
    { path: "/sobre", priority: 0.6, changeFrequency: "monthly" },
    { path: "/como-ganhamos-dinheiro", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contato", priority: 0.5, changeFrequency: "yearly" },
    { path: "/privacidade", priority: 0.3, changeFrequency: "yearly" },
    { path: "/termos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, priority, changeFrequency }) => ({
      url: new URL(path, siteConfig.url).toString(),
      lastModified: new Date(),
      changeFrequency,
      priority,
    }),
  );

  const segmentedSitemaps: MetadataRoute.Sitemap = [
    "/sitemap-produtos.xml",
    "/sitemap-marcas.xml",
    "/sitemap-categorias.xml",
    "/sitemap-comparacoes.xml",
  ].map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.4,
  }));

  return [...staticEntries, ...segmentedSitemaps];
}
