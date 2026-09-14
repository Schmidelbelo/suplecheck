import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryPageData } from "@/modules/category/services/categoryPage.service";
import { CategoryFilterPage } from "@/modules/category/components/CategoryFilterPage";
import { CATEGORY_ROUTE_OVERRIDES } from "@/lib/catalog/productRoutes";

type Params = { params: Promise<{ slug: string }> };
const FILTER = "preco-por-dose" as const;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return buildMetadata({ title: "Categoria não encontrada", noIndex: true });
  return buildMetadata({
    title: `${data.category.name}: Menor Preço por Dose`,
    description: `Ranking de ${data.category.name} ordenado pelo preço real por dose — nunca por preço do pote, que engana quando o rendimento muda.`,
    path: `/categorias/${slug}/menor-preco-por-dose`,
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
      path={`/categorias/${slug}/menor-preco-por-dose`}
    />
  );
}
