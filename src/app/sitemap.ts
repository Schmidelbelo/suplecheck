import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

/**
 * Sitemap dinâmico. Rotas estáticas continuam declaradas aqui; as rotas
 * de produto (`/creatina/[slug]`) são geradas a partir do Prisma — sem
 * isso, o Google nunca descobre as páginas de produto por conta própria.
 * Só produtos `PUBLISHED` da categoria `creatina` entram: é a única
 * categoria com página real (`/creatina`) nesta fase (Domain Model —
 * outras categorias existem no banco, mas não têm rota pública ainda).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/creatina", priority: 0.9, changeFrequency: "daily" },
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

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", category: { slug: "creatina" } },
    select: { slug: true, updatedAt: true },
  });

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: new URL(`/creatina/${product.slug}`, siteConfig.url).toString(),
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries];
}
