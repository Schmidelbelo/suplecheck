import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CategoryFilterPage } from "@/modules/category/components/CategoryFilterPage";

export const metadata: Metadata = buildMetadata({
  title: "Creatina: Menor Preço por Dose",
  description:
    "Ranking de creatina ordenado pelo preço real por dose — nunca por preço do pote, que engana quando o rendimento muda.",
  path: "/creatina/menor-preco-por-dose",
});

export const revalidate = 43200;

export default function Page() {
  return (
    <CategoryFilterPage
      categorySlug="creatina"
      categoryName="Creatina"
      filter="preco-por-dose"
      path="/creatina/menor-preco-por-dose"
    />
  );
}
