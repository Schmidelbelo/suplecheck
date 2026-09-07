import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Aviso Médico e Científico",
  description:
    "O SupleScore compara produtos com base em rótulo e literatura pública — não substitui orientação médica, nutricional ou de um profissional de educação física.",
  path: "/aviso-medico",
});

const sections: LegalSection[] = [
  {
    title: "1. Este site não presta aconselhamento médico",
    body: (
      <p>
        O conteúdo do SupleScore — incluindo notas, comparações e textos explicativos — tem
        finalidade informativa e de comparação de produtos. Não é, e não substitui, orientação
        médica, nutricional ou de educação física individualizada. Antes de iniciar o uso de
        qualquer suplemento, consulte um médico, nutricionista ou profissional habilitado, que pode
        avaliar sua condição de saúde, medicamentos em uso e objetivos específicos.
      </p>
    ),
  },
  {
    title: "2. O que o Índice SupleScore mede — e o que não mede",
    body: (
      <p>
        O Índice mede custo-benefício, transparência de rótulo, preço e reputação de um produto
        comparado a outros da mesma categoria (ver <Link href="/metodologia">Metodologia</Link>).
        Ele não mede, e não deve ser interpretado como, eficácia clínica individual, segurança para
        uma condição de saúde específica ou adequação a um objetivo pessoal de treino ou dieta.
      </p>
    ),
  },
  {
    title: "3. Suplementos não substituem alimentação e tratamento",
    body: (
      <p>
        Suplementos alimentares são um complemento à dieta, não um substituto para alimentação
        equilibrada, tratamento médico prescrito ou hábitos de treino orientados por profissional.
        Resultados variam por pessoa e não são garantidos por nenhum produto comparado aqui.
      </p>
    ),
  },
  {
    title: "4. Regulação",
    body: (
      <p>
        No Brasil, suplementos alimentares são regulados pela ANVISA. A existência de um produto no
        catálogo do SupleScore não é uma certificação, aprovação ou endosso regulatório — é uma
        comparação editorial independente entre produtos legalmente comercializados.
      </p>
    ),
  },
];

export default function AvisoMedicoPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Aviso Médico e Científico", href: "/aviso-medico" },
        ])}
      />
      <PageHeader
        eyebrow="Aviso importante"
        title="Aviso Médico e Científico"
        description="Comparação de produtos não é orientação de saúde — leia antes de decidir."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Aviso Médico e Científico" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="7 de setembro de 2026" />
      </Section>
    </>
  );
}
