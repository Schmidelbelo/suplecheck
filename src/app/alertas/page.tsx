import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { AlertsCenterClient } from "@/modules/monitoring/components/AlertsCenterClient";

export const metadata: Metadata = buildMetadata({
  title: "Central de Alertas",
  description:
    "Seus alertas de preço ativos e produtos monitorados — salvos só neste navegador, sem login.",
  path: "/alertas",
});

export default function AlertasPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Central de Alertas", href: "/alertas" },
        ])}
      />
      <PageHeader
        eyebrow="Monitoramento"
        title="Central de Alertas"
        description="Todos os alertas de preço que você configurou, com a condição e o preço atual de cada produto — salvo só neste navegador, sem envio de e-mail ainda."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Central de Alertas" }]}
      />
      <Section>
        <AlertsCenterClient />
      </Section>
    </>
  );
}
