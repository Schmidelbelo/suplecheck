import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ProductDetailPage,
  buildProductDetailMetadata,
} from "@/modules/evaluation/components/ProductDetailPage";
import { CATEGORY_ROUTE_OVERRIDES, productDetailPath } from "@/lib/catalog/productRoutes";

interface PageProps {
  params: Promise<{ slug: string; produto: string }>;
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

export default async function CategoryProductDetailPage({ params }: PageProps) {
  const { slug, produto } = await params;

  if (CATEGORY_ROUTE_OVERRIDES[slug]) {
    redirect(productDetailPath(slug, produto));
  }

  return <ProductDetailPage slug={produto} categorySlug={slug} />;
}
