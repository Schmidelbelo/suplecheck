import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { formatDate } from "@/lib/utils/format";
import { RankingEntryCard } from "@/modules/evaluation/components/RankingEntryCard";
import type { RankingView } from "@/modules/evaluation/types";

export const metadata: Metadata = buildMetadata({
  title: "Qual a Melhor Creatina? Ranking Comparativo",
  description:
    "Qual a melhor creatina em custo-benefício? Ranking comparativo com nota do Índice SupleCheck, preço por dose e transparência do rótulo — calculado a partir de dados reais, sem posição paga.",
  path: "/creatina",
});

export const revalidate = 0;

export default async function CreatinaRankingPage() {
  const ranking = await fetchApiOrNull<RankingView>("/api/evaluation/rankings/creatina/view");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Creatina", href: "/creatina" },
        ])}
      />
      <PageHeader
        eyebrow="Ranking"
        title="Qual a melhor creatina? Ranking comparativo"
        description="Cada produto abaixo foi avaliado pelo Índice SupleCheck a partir de custo-benefício, transparência do rótulo, preço por dose, reputação, promessas de marketing e confiabilidade da loja — nunca patrocinado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Creatina" }]}
      />

      <Section className="border-border border-b">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-text-muted text-lg">
            Não existe uma única &ldquo;melhor creatina&rdquo; para todo mundo — existe a que
            entrega mais princípio ativo pelo preço pago, com rótulo transparente e sem promessas
            exageradas. É exatamente isso que o ranking abaixo compara, produto a produto, usando os
            mesmos seis critérios documentados em{" "}
            <a href="/metodologia" className="text-brand font-medium hover:underline">
              Metodologia
            </a>
            .
          </p>
        </div>
      </Section>

      <Section>
        {ranking && ranking.entries.length > 0 ? (
          <div className="flex flex-col gap-6">
            <p className="text-text-muted text-sm">
              Ranking gerado em {formatDate(ranking.generatedAt)} · {ranking.entries.length}{" "}
              produtos avaliados
            </p>
            <div className="flex flex-col gap-4">
              {ranking.entries.map((entry) => (
                <RankingEntryCard key={entry.product.id} entry={entry} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="O ranking de creatinas ainda não foi gerado"
            description="Assim que o Índice SupleCheck for calculado para os produtos desta categoria, eles aparecerão aqui."
          />
        )}
      </Section>

      <Section className="border-border bg-bg-subtle border-b">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
            Como escolher a melhor creatina
          </h2>
          <p className="text-text-muted">
            A creatina monohidratada é uma molécula simples e amplamente estudada — a diferença real
            entre os produtos do mercado não costuma estar no ingrediente em si, mas em coisas que
            dá para medir: se a dose declarada no rótulo corresponde ao que a literatura considera
            eficaz, se o rótulo é transparente sobre isso, quanto você paga por dose (não por pote)
            e a reputação real de quem compra — entre outros fatores. É exatamente essa comparação
            que o ranking acima resume em uma nota única, calculada a partir dos seis critérios
            documentados, um a um, em{" "}
            <a href="/como-avaliamos" className="text-brand font-medium hover:underline">
              Como Avaliamos
            </a>
            .
          </p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
            Creatina vale a pena?
          </h2>
          <p className="text-text-muted">
            A creatina está entre os suplementos mais estudados para desempenho físico, e por isso
            costuma valer a pena — mas &ldquo;vale a pena&rdquo; depende do produto específico, não
            só do ingrediente. Um produto com dosagem abaixo da faixa eficaz, preço por dose alto ou
            rótulo pouco transparente pode não valer o que custa, mesmo sendo tecnicamente
            &ldquo;creatina&rdquo;. O SupleCheck não faz recomendação de uso ou de saúde —
            comparamos os produtos disponíveis para que essa decisão seja seguida com dados, não com
            a embalagem mais chamativa.
          </p>
        </div>
      </Section>
    </>
  );
}
