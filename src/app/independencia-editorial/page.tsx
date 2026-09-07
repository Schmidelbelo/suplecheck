import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Independência Editorial",
  description:
    "Como a curadoria e o cálculo de nota do SupleScore ficam estruturalmente separados de qualquer decisão comercial ou de afiliados.",
  path: "/independencia-editorial",
});

const sections: LegalSection[] = [
  {
    title: "1. A nota é calculada antes de qualquer decisão comercial",
    body: (
      <p>
        O Índice de um produto é calculado a partir de composição, rótulo e preço reais — nunca a
        partir de se existe (ou não) um programa de afiliado ativo para aquela loja ou marca. Um
        produto pode ter nota alta e nenhum link de afiliado configurado, ou nota baixa e um
        programa de afiliado ativo: as duas coisas nunca se cruzam no cálculo.
      </p>
    ),
  },
  {
    title: "2. Separação entre curadoria e monetização",
    body: (
      <p>
        Quem decide critérios, pesos e quais fatos coletar para uma avaliação é uma função
        editorial. Quem negocia programas de afiliado é uma função comercial. Nenhuma delas aprova o
        trabalho da outra — ver <Link href="/como-ganhamos-dinheiro">Como Ganhamos Dinheiro</Link>{" "}
        para o detalhe de como o SupleScore se sustenta financeiramente.
      </p>
    ),
  },
  {
    title: "3. Nenhuma posição é comprada",
    body: (
      <p>
        Não existe, hoje ou planejado, qualquer forma de uma marca pagar para aparecer em posição
        mais alta no ranking, receber nota melhor ou pular a fila de avaliação. Isso está descrito
        também na <Link href="/politica-editorial">Política Editorial</Link>.
      </p>
    ),
  },
  {
    title: "4. O que isso significa na prática",
    body: (
      <p>
        Se um dia um produto sem nenhuma relação comercial com o SupleScore for o melhor avaliado de
        sua categoria, ele aparece em primeiro lugar — exatamente como aconteceria com qualquer
        outro produto nas mesmas condições.
      </p>
    ),
  },
];

export default function IndependenciaEditorialPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Independência Editorial", href: "/independencia-editorial" },
        ])}
      />
      <PageHeader
        eyebrow="Transparência"
        title="Independência Editorial"
        description="A separação estrutural entre quem avalia um produto e quem negocia com a marca dele."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Independência Editorial" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="7 de setembro de 2026" />
      </Section>
    </>
  );
}
