import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";
import { FavoritesPageClient } from "@/modules/evaluation/components/FavoritesPageClient";

export const metadata: Metadata = buildMetadata({
  title: "Meus favoritos",
  description: "Produtos que você salvou para comparar ou decidir depois.",
  path: "/favoritos",
  noIndex: true,
});

export default function FavoritesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sua lista"
        title="Meus favoritos"
        description="Produtos salvos neste navegador — nunca saem daqui até você removê-los."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Favoritos" }]}
      />
      <Section>
        <FavoritesPageClient />
      </Section>
    </>
  );
}
