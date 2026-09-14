import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CategoryFilterPage } from "@/modules/category/components/CategoryFilterPage";

export const metadata: Metadata = buildMetadata({
  title: "Creatina: Mais Bem Avaliadas",
  description:
    "Ranking de creatina ordenado pela nota do Índice SupleScore — custo-benefício, transparência do rótulo e confiabilidade da loja, sem posição paga.",
  path: "/creatina/mais-bem-avaliados",
});

export const revalidate = 43200;

export default function Page() {
  return (
    <CategoryFilterPage
      categorySlug="creatina"
      categoryName="Creatina"
      filter="mais-bem-avaliados"
      path="/creatina/mais-bem-avaliados"
    />
  );
}
