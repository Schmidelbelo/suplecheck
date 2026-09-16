import type { Metadata } from "next";
import Link from "next/link";
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
      <Section className="border-border border-b py-4">
        <p className="text-text-muted text-sm">
          Esta página cobre cobertura de <em>configuração</em> (preço + afiliação). Para volume real
          de cliques em &ldquo;Ver oferta&rdquo; — total, por origem, por loja/produto — ver{" "}
          <Link href="/admin/metrics" className="text-brand underline">
            /admin/metrics
          </Link>
          .
        </p>
      </Section>
      <Section>
        <MonetizationAuditClient />
      </Section>
    </>
  );
}
