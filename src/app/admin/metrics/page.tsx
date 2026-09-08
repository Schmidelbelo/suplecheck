import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";
import { AdminMetricsClient } from "@/modules/monetization/components/AdminMetricsClient";

export const metadata: Metadata = buildMetadata({
  title: "Métricas de monetização",
  path: "/admin/metrics",
  noIndex: true,
});

export default function AdminMetricsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Métricas de monetização"
        description="Cliques de saída por loja, produto e categoria — protegido por ADMIN_API_KEY."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admin" }, { label: "Métricas" }]}
      />
      <Section>
        <AdminMetricsClient />
      </Section>
    </>
  );
}
