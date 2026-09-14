import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryPageData } from "@/modules/category/services/categoryPage.service";
import { CategoryFilterPage } from "@/modules/category/components/CategoryFilterPage";
import { CATEGORY_ROUTE_OVERRIDES } from "@/lib/catalog/productRoutes";

type Params = { params: Promise<{ slug: string }> };
const FILTER = "custo-beneficio" as const;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return buildMetadata({ title: "Categoria não encontrada", noIndex: true });
  return buildMetadata({
    title: `Melhor ${data.category.name} Custo-Benefício`,
    description: `Ranking de ${data.category.name} ordenado por custo-benefício real (Score Geral SupleScore) — qualidade e preço combinados, sem posição paga.`,
    path: `/categorias/${slug}/melhor-custo-beneficio`,
  });
}

export const revalidate = 43200;

export default async function Page({ params }: Params) {
  const { slug } = await params;
  if (CATEGORY_ROUTE_OVERRIDES[slug]) notFound();
  const data = await getCategoryPageData(slug);
  if (!data) notFound();
  return (
    <CategoryFilterPage
      categorySlug={slug}
      categoryName={data.category.name}
      filter={FILTER}
      path={`/categorias/${slug}/melhor-custo-beneficio`}
    />
  );
}
