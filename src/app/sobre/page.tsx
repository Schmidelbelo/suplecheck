import type { Metadata } from "next";
import { Target, Users, Eye } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = buildMetadata({
  title: "Sobre",
  description:
    "Conheça o SupleCheck: a missão, os valores e a razão de existir de uma plataforma independente de comparação de suplementos.",
  path: "/sobre",
});

const values = [
  {
    icon: Eye,
    title: "Transparência",
    description:
      "Todo critério que compõe uma nota é público. Se não podemos explicar o porquê de um número, ele não entra na fórmula.",
  },
  {
    icon: Target,
    title: "Independência",
    description:
      "Não vendemos posição no ranking. A nota de um produto não muda porque uma marca anuncia conosco.",
  },
  {
    icon: Users,
    title: "Foco em quem compra",
    description:
      "Cada decisão de produto é tomada pensando em quem está na gôndola (física ou digital) tentando entender um rótulo.",
  },
];

export default function SobrePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Sobre", href: "/sobre" },
        ])}
      />
      <PageHeader
        eyebrow="Sobre o SupleCheck"
        title="Comparação de suplementos que não depende de quem paga mais"
        description="Nascemos da frustração de tentar comparar dois potes de creatina e descobrir que isso era muito mais difícil do que deveria ser."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Sobre" }]}
      />

      <Section className="border-border border-b">
        <div className="text-text-muted mx-auto flex max-w-3xl flex-col gap-6 text-lg">
          <p>
            O mercado de suplementos brasileiro cresce a taxas de dois dígitos ao ano, com centenas
            de marcas disputando espaço em prateleiras físicas e digitais. Para quem compra, isso
            deveria significar mais opções — mas na prática significa mais ruído: rótulos com termos
            técnicos, dosagens em formatos diferentes e uma quantidade enorme de marketing
            competindo por atenção.
          </p>
          <p>
            O SupleCheck existe para resolver um problema específico: transformar a composição real
            de um produto — o que está de fato no rótulo — em uma comparação simples, pública e
            auditável. Não somos uma loja, não recomendamos marcas por patrocínio e não escondemos
            como calculamos cada nota.
          </p>
          <p>
            Começamos pequenos, por desenho: o primeiro ranking cobre uma única categoria
            (creatina), com uma metodologia documentada desde o primeiro produto avaliado. O plano é
            expandir categoria por categoria, sempre com o mesmo padrão de rigor.
          </p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-text text-3xl font-bold md:text-4xl">O que nos guia</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="border-border flex flex-col gap-3 rounded-lg border p-6"
            >
              <div className="bg-brand-subtle text-brand flex size-10 items-center justify-center rounded-md">
                <value.icon className="size-5" aria-hidden />
              </div>
              <h3 className="text-text text-base font-semibold">{value.title}</h3>
              <p className="text-text-muted text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
