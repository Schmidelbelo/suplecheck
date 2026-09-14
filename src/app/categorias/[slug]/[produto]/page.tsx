import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ProductDetailPage,
  buildProductDetailMetadata,
} from "@/modules/evaluation/components/ProductDetailPage";
import { CATEGORY_ROUTE_OVERRIDES, productDetailPath } from "@/lib/catalog/productRoutes";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  params: Promise<{ slug: string; produto: string }>;
}

/**
 * Gera todas as páginas de produto publicadas em HTML estático no
 * build (ISR verdadeiro) — sem isso, cada URL só vira estática depois
 * do primeiro acesso. `dynamicParams` continua `true` por padrão: um
 * produto publicado DEPOIS deste build ainda renderiza on-demand e
 * some do cache do jeito normal, só não vem pré-gerado. Se o banco
 * estiver indisponível no momento do build, cai para geração 100%
 * on-demand (nunca quebra o build por causa disto).
 */
export async function generateStaticParams(): Promise<{ slug: string; produto: string }[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        category: { slug: { notIn: Object.keys(CATEGORY_ROUTE_OVERRIDES) } },
      },
      select: { slug: true, category: { select: { slug: true } } },
    });
    return products.map((p) => ({ slug: p.category.slug, produto: p.slug }));
  } catch {
    return [];
  }
}

/**
 * Página de detalhe de produto para qualquer categoria SEM rota própria
 * (hoje: todas exceto creatina — ver `src/lib/catalog/productRoutes.ts`).
 * Mesma regra de `/categorias/[slug]/page.tsx`: uma categoria com rota
 * própria nunca é servida por aqui, sempre redireciona para a
 * canônica — evita conteúdo duplicado entre `/categorias/creatina/x` e
 * `/creatina/x`.
 *
 * Toda a renderização real vive em `ProductDetailPage`, a MESMA função
 * usada por `/creatina/[slug]` — nenhuma lógica de apresentação
 * duplicada. A validação de "o produto realmente pertence a esta
 * categoria" (senão 404) também vive lá, então um slug de produto
 * correto com `[slug]` de categoria errado nunca renderiza sob o
 * rótulo/ranking errado.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, produto } = await params;
  return buildProductDetailMetadata({ slug: produto, categorySlug: slug });
}

// Mesmo motivo/intervalo de `/creatina/[slug]` — a página de produto é
// a de maior tráfego potencial do catálogo e não tinha cache nenhum.
export const revalidate = 43200;

export default async function CategoryProductDetailPage({ params }: PageProps) {
  const { slug, produto } = await params;

  if (CATEGORY_ROUTE_OVERRIDES[slug]) {
    redirect(productDetailPath(slug, produto));
  }

  return <ProductDetailPage slug={produto} categorySlug={slug} />;
}
