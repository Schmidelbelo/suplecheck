import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { CategoryFilterPage } from "@/modules/category/components/CategoryFilterPage";

export const metadata: Metadata = buildMetadata({
  title: "Creatina Mais Vendida",
  description:
    'Creatinas ordenadas pelo número real de cliques em "Ver oferta" registrados no SupleScore — nunca um dado de venda inventado.',
  path: "/creatina/mais-vendidos",
});

export const revalidate = 43200;

export default function Page() {
  return (
    <CategoryFilterPage
      categorySlug="creatina"
      categoryName="Creatina"
      filter="mais-vendidos"
      path="/creatina/mais-vendidos"
    />
  );
}
