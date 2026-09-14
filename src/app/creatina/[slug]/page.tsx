import type { Metadata } from "next";
import {
  ProductDetailPage,
  buildProductDetailMetadata,
} from "@/modules/evaluation/components/ProductDetailPage";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Todos os produtos publicados de creatina pré-gerados no build — mesmo padrão de `/categorias/[slug]/[produto]`. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED", category: { slug: "creatina" } },
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

/**
 * `creatina` tem rota própria (URLs já indexadas desde a Fase 0) — toda
 * a renderização real vive em `ProductDetailPage`, reaproveitada
 * também por `/categorias/[slug]/[produto]` para qualquer outra
 * categoria. Ver `src/lib/catalog/productRoutes.ts` para o contrato
 * dessa exceção.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildProductDetailMetadata({ slug, categorySlug: "creatina" });
}

// Sem isto a página batia direto no banco a cada requisição — a de
// maior tráfego potencial do catálogo, e a mais sensível à instabilidade
// de conexão do Neon documentada em várias sprints. Mesmo intervalo já
// usado nas páginas de listagem/categoria irmãs.
export const revalidate = 43200;

export default async function CreatinaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} categorySlug="creatina" />;
}
