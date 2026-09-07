import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { FAQSection } from "@/components/marketing/FAQSection";
import { extendedFaq } from "@/config/faq";

export const metadata: Metadata = buildMetadata({
  title: "Perguntas Frequentes",
  description:
    "Respostas diretas sobre como o SupleScore calcula notas, de onde vêm os dados, como ganha dinheiro e o que fazer quando algo parece errado.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Perguntas Frequentes", href: "/faq" },
        ])}
      />
      <JsonLd data={faqPageSchema(extendedFaq)} />
      <PageHeader
        eyebrow="Dúvidas"
        title="Perguntas Frequentes"
        description="As perguntas que mais recebemos sobre como o SupleScore funciona, por dentro."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Perguntas Frequentes" }]}
      />
      <Section>
        <FAQSection items={extendedFaq} />
      </Section>
    </>
  );
}
