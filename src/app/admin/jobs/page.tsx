import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";
import { AdminJobsClient } from "@/modules/pricing/components/AdminJobsClient";

export const metadata: Metadata = buildMetadata({
  title: "Jobs de captura de preço",
  path: "/admin/jobs",
  noIndex: true,
});

export default function AdminJobsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Jobs de captura de preço"
        description="Histórico de execuções do pipeline automático e disparo manual — protegido por ADMIN_API_KEY."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admin" }, { label: "Jobs" }]}
      />
      <Section>
        <AdminJobsClient />
      </Section>
    </>
  );
}
