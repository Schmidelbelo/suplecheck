import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Política de Correções",
  description:
    "Como o SupleScore trata erros de fato, recalcula notas e preserva o histórico de cada avaliação — nunca reescrevendo uma nota antiga em silêncio.",
  path: "/politica-de-correcoes",
});

const sections: LegalSection[] = [
  {
    title: "1. O que motiva uma reavaliação",
    body: (
      <ul className="flex flex-col gap-2">
        <li>A marca altera a fórmula, o rótulo ou a dosagem de um produto;</li>
        <li>O preço monitorado muda o suficiente para afetar custo-benefício ou preço por dose;</li>
        <li>Encontramos ou recebemos evidência de um dado incorreto na avaliação atual;</li>
        <li>
          A metodologia em si é revisada (nova versão) — ver Metodologia, seção de versionamento.
        </li>
      </ul>
    ),
  },
  {
    title: "2. Como uma correção é aplicada",
    body: (
      <p>
        Nunca editamos uma nota já calculada. Uma reavaliação gera um cálculo novo, com data e
        versão de metodologia próprias — a nota anterior continua visível no histórico da página do
        produto, marcada com a data em que valia. Isso é uma garantia estrutural, não uma promessa:
        o sistema é feito para nunca sobrescrever um registro de avaliação.
      </p>
    ),
  },
  {
    title: "3. Como reportar um erro",
    body: (
      <p>
        Encontrou um dado que parece errado (rótulo desatualizado, preço incorreto, produto
        descontinuado)? Use a página de <Link href="/contato">Contato</Link>. Toda correção
        reportada é verificada contra a fonte original antes de ser aplicada — nunca aceita apenas
        porque foi solicitada.
      </p>
    ),
  },
  {
    title: "4. O que não é uma correção",
    body: (
      <p>
        Uma marca discordar da própria nota não é, por si só, motivo de correção — só o é quando
        aponta um erro real de fato (dado incorreto), verificável contra a fonte. Discordância sobre
        peso de critério ou metodologia é tratada como sugestão de revisão de metodologia, não como
        erro a corrigir produto a produto.
      </p>
    ),
  },
];

export default function PoliticaDeCorrecoesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Política de Correções", href: "/politica-de-correcoes" },
        ])}
      />
      <PageHeader
        eyebrow="Transparência"
        title="Política de Correções"
        description="Erros acontecem — o que importa é como são corrigidos e se o histórico anterior permanece visível."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Política de Correções" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="7 de setembro de 2026" />
      </Section>
    </>
  );
}
