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
  title: "Ranking de Creatinas",
  description:
    "O ranking de creatinas do SupleCheck: nota do Índice SupleCheck, preço, preço por dose e classificação de cada produto, calculados a partir de dados reais.",
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
        title="Ranking de Creatinas"
        description="Cada produto abaixo foi avaliado pelo Índice SupleCheck a partir de composição, preço por dose, transparência do rótulo, reputação e confiabilidade da loja — nunca patrocinado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Creatina" }]}
      />

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
    </>
  );
}
