import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { MarketStatCards } from "@/components/market/MarketStatCards";
import { BrandRankingTable } from "@/components/market/BrandRankingTable";
import { MarketInsightsList } from "@/components/market/MarketInsightsList";
import type { MarketApiResponse } from "@/modules/market/types";

export const metadata: Metadata = buildMetadata({
  title: "Panorama do Mercado de Suplementos",
  description:
    "Estatísticas reais do catálogo do SupleCheck: preço médio, melhores e piores notas, ranking de marcas — tudo calculado em tempo real, sem dado inventado.",
  path: "/mercado",
});

export const revalidate = 0;

export default async function MercadoPage() {
  const market = await fetchApiOrNull<MarketApiResponse>("/api/market");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Mercado", href: "/mercado" },
        ])}
      />
      <PageHeader
        eyebrow="Inteligência de Mercado"
        title="Panorama do Mercado"
        description="Estatísticas agregadas de todo o catálogo avaliado pelo SupleCheck — preços, notas e ranking de marcas, recalculados em tempo real a partir dos dados reais."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Mercado" }]}
      />

      {market ? (
        <>
          <Section>
            <div className="flex flex-col gap-6">
              <MarketStatCards statistics={market.statistics} />
              <MarketInsightsList insights={market.insights} />
            </div>
          </Section>

          <Section className="border-border border-t">
            <div className="flex flex-col gap-6">
              <h2 className="text-text text-2xl font-bold">Ranking de marcas</h2>
              <BrandRankingTable brandRanking={market.brandRanking} />
            </div>
          </Section>
        </>
      ) : (
        <Section>
          <EmptyState
            icon={<BarChart3 aria-hidden />}
            title="Ainda não há dados suficientes"
            description="O Panorama do Mercado aparece assim que houver produtos avaliados no catálogo."
          />
        </Section>
      )}
    </>
  );
}
