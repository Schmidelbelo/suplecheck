import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CategoryFilterPage } from "@/modules/category/components/CategoryFilterPage";

export const metadata: Metadata = buildMetadata({
  title: "Melhor Creatina Custo-Benefício",
  description:
    "Ranking de creatina ordenado por custo-benefício real (Score Geral SupleScore) — qualidade e preço combinados, sem posição paga.",
  path: "/creatina/melhor-custo-beneficio",
});

export const revalidate = 43200;

export default function Page() {
  return (
    <CategoryFilterPage
      categorySlug="creatina"
      categoryName="Creatina"
      filter="custo-beneficio"
      path="/creatina/melhor-custo-beneficio"
    />
  );
}
