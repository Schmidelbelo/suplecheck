import type { Metadata } from "next";
import { Beaker, FileSearch, RefreshCw, Scale, Tag, Users2 } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = buildMetadata({
  title: "Como Avaliamos",
  description:
    "Entenda o processo de avaliação do SupleCheck: de onde vêm os dados, quais critérios compõem o Índice e com que frequência revisamos cada produto.",
  path: "/como-avaliamos",
});

const criteria = [
  {
    icon: Beaker,
    weight: "35%",
    title: "Pureza da composição",
    description:
      "Checamos o rótulo em busca de cargas, aditivos e substâncias não declaradas. Produtos com composição limpa e alinhada ao que prometem pontuam mais alto.",
  },
  {
    icon: Scale,
    weight: "30%",
    title: "Dosagem por porção",
    description:
      "Comparamos a quantidade real do princípio ativo por porção com as referências de literatura científica para a categoria — não o que a embalagem sugere visualmente.",
  },
  {
    icon: FileSearch,
    weight: "20%",
    title: "Transparência do rótulo",
    description:
      "Misturas proprietárias (que escondem a dosagem individual de cada ingrediente) e informações nutricionais incompletas reduzem a nota.",
  },
  {
    icon: Tag,
    weight: "15%",
    title: "Custo-benefício",
    description:
      "Calculamos o preço por dose efetiva do princípio ativo, não o preço por pote — dois produtos de preço igual podem ter custo por dose muito diferente.",
  },
];

const sources = [
  {
    icon: FileSearch,
    title: "Rótulo e tabela nutricional",
    description:
      "Fonte primária de qualquer avaliação — coletada diretamente da embalagem ou do fabricante.",
  },
  {
    icon: Users2,
    title: "Literatura científica",
    description:
      "Estudos publicados definem as faixas de dosagem eficaz usadas como referência por categoria.",
  },
  {
    icon: RefreshCw,
    title: "Monitoramento de preço",
    description:
      "Preços são reconsultados periodicamente nas principais lojas para manter o custo-benefício atualizado.",
  },
];

export default function ComoAvaliamosPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Como Avaliamos", href: "/como-avaliamos" },
        ])}
      />
      <PageHeader
        eyebrow="Processo"
        title="Como avaliamos cada produto"
        description="Um processo repetível, documentado e aplicado da mesma forma a qualquer marca."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Como Avaliamos" }]}
      />

      <Section className="border-border border-b">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
            Quatro critérios, com pesos definidos
          </h2>
          <p className="text-text-muted mt-4">
            A nota final (Índice SupleCheck) é a soma ponderada dos quatro critérios abaixo. Nenhum
            critério é atribuído subjetivamente.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {criteria.map((criterion) => (
            <Card key={criterion.title}>
              <CardContent className="flex gap-4 p-6">
                <div className="bg-bg-muted text-text flex size-11 shrink-0 items-center justify-center rounded-md">
                  <criterion.icon className="size-5" aria-hidden />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-text text-base font-semibold">{criterion.title}</h3>
                    <span className="text-text-subtle text-xs font-medium">
                      peso {criterion.weight}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">{criterion.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="border-border bg-bg-subtle border-b">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
            De onde vêm os dados
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {sources.map((source) => (
            <div
              key={source.title}
              className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-6"
            >
              <div className="bg-brand-subtle text-brand flex size-10 items-center justify-center rounded-md">
                <source.icon className="size-5" aria-hidden />
              </div>
              <h3 className="text-text text-base font-semibold">{source.title}</h3>
              <p className="text-text-muted text-sm">{source.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="text-text-muted mx-auto flex max-w-3xl flex-col gap-4">
          <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
            Limitações honestas
          </h2>
          <p>
            Não realizamos testes laboratoriais próprios — nossa análise parte de rótulo declarado,
            documentação pública do fabricante e literatura científica disponível. Quando um dado
            não pode ser verificado com confiança, isso é sinalizado explicitamente no produto, em
            vez de estimado.
          </p>
          <p>
            Quer entender a fórmula matemática por trás da nota? A página de{" "}
            <a href="/metodologia" className="text-brand font-medium hover:underline">
              Metodologia
            </a>{" "}
            detalha o cálculo passo a passo.
          </p>
        </div>
      </Section>
    </>
  );
}
