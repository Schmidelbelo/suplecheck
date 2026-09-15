import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";
import { MonetizationAuditClient } from "@/modules/monetization/components/MonetizationAuditClient";

export const metadata: Metadata = buildMetadata({
  title: "Cobertura de Monetização",
  path: "/admin/monetizacao",
  noIndex: true,
});

export default function AdminMonetizationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Cobertura de Monetização"
        description="Cobertura geral, por loja e por categoria — quais lojas destravar primeiro e quais produtos têm preço mas não geram comissão. Nunca inventa link de afiliado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admin" }, { label: "Monetização" }]}
      />
      <Section>
        <MonetizationAuditClient />
      </Section>
    </>
  );
}
