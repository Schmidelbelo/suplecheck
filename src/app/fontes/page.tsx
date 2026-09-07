import type { Metadata } from "next";
import Link from "next/link";
import { FileText, FlaskConical, Tag, Store } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = buildMetadata({
  title: "Fontes Utilizadas",
  description:
    "De onde vem cada dado usado no cálculo do Índice SupleScore: rótulo oficial, literatura científica, preço monitorado e reputação de loja.",
  path: "/fontes",
});

const sources = [
  {
    icon: FileText,
    title: "Rótulo e página oficial do produto",
    description:
      "Composição, dosagem por porção e ingredientes vêm sempre do rótulo declarado pelo fabricante ou da página oficial do produto — nunca de uma estimativa própria. Cada produto publicado guarda a URL da fonte usada, exibida na seção de transparência da sua página.",
  },
  {
    icon: FlaskConical,
    title: "Literatura científica",
    description:
      "As faixas de referência usadas para julgar se uma dosagem é eficaz (por exemplo, quantidade de creatina ou de proteína por dose) vêm de estudos publicados sobre cada princípio ativo — não de recomendação da própria marca do produto avaliado.",
  },
  {
    icon: Tag,
    title: "Preço monitorado",
    description:
      "O preço de cada oferta é capturado periodicamente na loja real onde o produto é vendido, com a URL de origem preservada. Quando uma captura de preço falha ou fica desatualizada, isso é sinalizado explicitamente, nunca substituído por um valor antigo.",
  },
  {
    icon: Store,
    title: "Reputação da loja",
    description:
      "A confiabilidade de uma loja (usada no critério de mesmo nome) é avaliada por histórico de reclamações e tempo de mercado — nunca pela comissão de afiliado que essa loja possa pagar.",
  },
];

export default function FontesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Fontes Utilizadas", href: "/fontes" },
        ])}
      />
      <PageHeader
        eyebrow="Transparência"
        title="De onde vem cada dado"
        description="Nenhum número do Índice SupleScore existe sem uma fonte identificável — aqui estão todas."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Fontes Utilizadas" }]}
      />

      <Section>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {sources.map((source) => (
            <div
              key={source.title}
              className="border-border flex flex-col gap-3 rounded-lg border p-6"
            >
              <div className="bg-brand-subtle text-brand flex size-10 items-center justify-center rounded-md">
                <source.icon className="size-5" aria-hidden />
              </div>
              <h2 className="text-text text-base font-semibold">{source.title}</h2>
              <p className="text-text-muted text-sm">{source.description}</p>
            </div>
          ))}
        </div>

        <div className="text-text-muted mx-auto mt-10 max-w-4xl text-sm">
          Quer ver como essas fontes se combinam em critérios com peso definido? Veja{" "}
          <Link href="/como-avaliamos" className="text-brand font-medium hover:underline">
            Como Avaliamos
          </Link>{" "}
          e a fórmula completa em{" "}
          <Link href="/metodologia" className="text-brand font-medium hover:underline">
            Metodologia
          </Link>
          .
        </div>
      </Section>
    </>
  );
}
