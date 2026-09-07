import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Política Editorial",
  description:
    "As regras que governam como um produto entra no catálogo, como é avaliado e o que nunca influencia essa avaliação no SupleScore.",
  path: "/politica-editorial",
});

const sections: LegalSection[] = [
  {
    title: "1. O que decide se um produto entra no catálogo",
    body: (
      <p>
        Um produto entra no catálogo quando temos rótulo/composição real e uma oferta de preço
        verificável — nunca por indicação paga ou por acordo comercial antecipado. Marcas podem
        sugerir produtos pela página de <Link href="/contato">Contato</Link>, mas isso só adianta a
        curadoria, nunca substitui a avaliação pelos mesmos critérios de qualquer outro produto.
      </p>
    ),
  },
  {
    title: "2. O que nunca influencia uma nota",
    body: (
      <ul className="flex flex-col gap-2">
        <li>Pagamento, patrocínio ou parceria comercial de qualquer tipo;</li>
        <li>Volume de vendas gerado por um link de afiliado;</li>
        <li>Pressão de assessoria de imprensa ou relacionamento com a marca;</li>
        <li>Opinião pessoal de quem cura o catálogo sobre a marca.</li>
      </ul>
    ),
  },
  {
    title: "3. Quem toma as decisões editoriais",
    body: (
      <p>
        A curadoria de catálogo (quais produtos entram, quais fatos são coletados) é uma função
        editorial, separada de qualquer função comercial — ver{" "}
        <Link href="/independencia-editorial">Independência Editorial</Link> para o detalhe
        estrutural dessa separação.
      </p>
    ),
  },
  {
    title: "4. Como um dado incompleto é tratado",
    body: (
      <p>
        Quando um fato necessário para um critério (por exemplo, dosagem exata ou preço atual) não
        pode ser confirmado com segurança, o produto permanece em rascunho — nunca publicado com um
        valor estimado no lugar. Ver <Link href="/fontes">Fontes Utilizadas</Link> para como cada
        fato é obtido.
      </p>
    ),
  },
  {
    title: "5. Correções e reavaliações",
    body: (
      <p>
        Quando encontramos ou recebemos um erro de fato (composição, preço, rótulo desatualizado), a
        correção é aplicada assim que verificada — nunca escondida. Ver a{" "}
        <Link href="/politica-de-correcoes">Política de Correções</Link> completa.
      </p>
    ),
  },
];

export default function PoliticaEditorialPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Política Editorial", href: "/politica-editorial" },
        ])}
      />
      <PageHeader
        eyebrow="Transparência"
        title="Política Editorial"
        description="As regras que governam o que entra no catálogo e como é avaliado — as mesmas para qualquer marca."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Política Editorial" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="7 de setembro de 2026" />
      </Section>
    </>
  );
}
