import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAQSection } from "@/components/marketing/FAQSection";
import { CategoryStatisticsSection } from "@/components/market/CategoryStatisticsSection";
import { ShareButton } from "@/modules/sharing/components/ShareButton";
import { RankingFilters } from "@/modules/evaluation/components/RankingFilters";
import { getCategoryPageData } from "@/modules/category/services/categoryPage.service";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { formatDate } from "@/lib/utils/format";
import type { FaqItem } from "@/config/faq";
import type { RankingView } from "@/modules/evaluation/types";
import type { MarketApiResponse } from "@/modules/market/types";

type Params = { params: Promise<{ slug: string }> };

/** Mesma regra de `/categorias/page.tsx`: categoria com rota própria nunca é servida por `[slug]` — evita conteúdo duplicado. */
const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return buildMetadata({ title: "Categoria não encontrada", noIndex: true });

  return buildMetadata({
    title: `${data.category.name}: Ranking e Avaliações`,
    description:
      data.category.description ?? `Página da categoria ${data.category.name} no SupleScore.`,
    path: `/categorias/${slug}`,
  });
}

export const revalidate = 300;

export default async function CategoryDetailPage({ params }: Params) {
  const { slug } = await params;

  if (CATEGORY_ROUTE_OVERRIDES[slug]) {
    redirect(CATEGORY_ROUTE_OVERRIDES[slug]!);
  }

  const data = await getCategoryPageData(slug);
  if (!data) notFound();

  const [ranking, market] = await Promise.all([
    fetchApiOrNull<RankingView>(`/api/evaluation/rankings/${slug}/view`),
    fetchApiOrNull<MarketApiResponse>(`/api/market?categorySlug=${slug}`),
  ]);

  const faqItems: FaqItem[] = [
    {
      question: `Já existe ranking de ${data.category.name} no SupleScore?`,
      answer:
        ranking && ranking.entries.length > 0
          ? `Sim — ${ranking.entries.length} produto${ranking.entries.length === 1 ? "" : "s"} de ${data.category.name} já ${ranking.entries.length === 1 ? "foi avaliado" : "foram avaliados"} pelo Índice SupleScore.`
          : `Ainda não. A categoria ${data.category.name} está cadastrada no catálogo, mas nenhum produto foi avaliado pela metodologia SupleScore até o momento.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Categorias", href: "/categorias" },
          { label: data.category.name, href: `/categorias/${slug}` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqItems)} />

      <PageHeader
        eyebrow="Categoria"
        title={data.category.name}
        description={data.category.description ?? undefined}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Categorias", href: "/categorias" },
          { label: data.category.name },
        ]}
      />

      <Section>
        {ranking && ranking.entries.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-text-muted text-sm">
                Ranking gerado em {formatDate(ranking.generatedAt)} · {ranking.entries.length}{" "}
                produtos avaliados
              </p>
              <ShareButton
                title={`Ranking de ${data.category.name} — SupleScore`}
                label="Compartilhar ranking"
              />
            </div>
            <RankingFilters entries={ranking.entries} />
          </div>
        ) : (
          <EmptyState
            title={`O ranking de ${data.category.name} ainda não foi gerado`}
            description="Assim que o Índice SupleScore for calculado para os produtos desta categoria, eles aparecerão aqui."
          />
        )}
      </Section>

      {market?.category ? (
        <Section className="border-border border-b">
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
              Estatísticas da categoria
            </h2>
            <CategoryStatisticsSection view={market.category} />
          </div>
        </Section>
      ) : null}

      <FAQSection items={faqItems} />
    </>
  );
}
