import type { Metadata } from "next";
import {
  ProductDetailPage,
  buildProductDetailMetadata,
} from "@/modules/evaluation/components/ProductDetailPage";

interface PageProps {
  params: Promise<{ slug: string }>;
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
export const revalidate = 300;

export default async function CreatinaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} categorySlug="creatina" />;
}
