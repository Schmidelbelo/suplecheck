import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";
import { DashboardClient } from "@/modules/evaluation/components/DashboardClient";

export const metadata: Metadata = buildMetadata({
  title: "Minha área",
  description: "Seus favoritos, histórico de visitas, comparações recentes e estatísticas.",
  path: "/minha-area",
  noIndex: true,
});

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sem login necessário"
        title="Minha área"
        description="Tudo o que você favoritou, visitou e comparou — salvo só neste navegador, sem cadastro."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Minha área" }]}
      />
      <Section>
        <DashboardClient />
      </Section>
    </>
  );
}
