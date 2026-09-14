import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";
import { ImageCentralClient } from "@/modules/media/components/ImageCentralClient";

export const metadata: Metadata = buildMetadata({
  title: "Central de Imagens",
  path: "/admin/imagens",
  noIndex: true,
});

export default function AdminImagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Central de Imagens"
        description="Produtos publicados sem imagem oficial local — arraste a foto da embalagem certa (marca, sabor, peso) para resolver. Nunca dependemos de URL externa depois disso."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admin" }, { label: "Imagens" }]}
      />
      <Section>
        <ImageCentralClient />
      </Section>
    </>
  );
}
