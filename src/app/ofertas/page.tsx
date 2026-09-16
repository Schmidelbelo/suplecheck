import type { Metadata } from "next";
import { TrendingDown, Star, Flame, Clock3 } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/db/prisma";
import { loadRankingView } from "@/modules/evaluation/services/rankingView.service";
import {
  loadCatalogPriceInfo,
  buildOffersOverview,
  type ProductPriceInfo,
} from "@/modules/pricing/lib/offersOverview";
import { OfferCard } from "@/modules/pricing/components/OfferCard";
import { productDetailPath } from "@/lib/catalog/productRoutes";
import { PriceEvolutionTable } from "@/modules/pricing/components/PriceEvolutionTable";
import { isTestSlug } from "@/lib/catalog/testDataGuard";

export const metadata: Metadata = buildMetadata({
  title: "Ofertas de Suplementos em Promoção — Preço Real, Sem Estimativa",
  description:
    "Melhores oportunidades do catálogo agora: produtos abaixo da média de preço da categoria, menores preços já registrados e capturas recentes — em todas as categorias avaliadas, calculado a partir de dados reais.",
  path: "/ofertas",
});

export const revalidate = 43200;

/**
 * Antes desta correção, a página só olhava pra `creatina` mesmo prometendo
 * "Creatina, Whey e Pré-Treino" no título — descobrimos isso auditando as
 * páginas públicas de maior intenção de compra (ver
 * `docs/PLANO_SEO_PAGINAS_PRIORITARIAS.md`). Agora percorre todas as
 * categorias ativas do catálogo, então a promessa do título/descrição bate
 * com o que a página de fato mostra, sem precisar listar categoria por
 * categoria (e sem ficar defasada quando uma categoria nova entrar).
 */
async function loadAllCategoriesPriceInfo(): Promise<ProductPriceInfo[]> {
  const allCategories = await prisma.category.findMany({
    where: { active: true },
    select: { slug: true },
  });
  // Nunca varre categoria de teste vazada no banco (ver testDataGuard.ts)
  // — hoje inofensivo (nenhuma tem Ranking gerado), mas explícito em vez
  // de depender desse acaso.
  const categories = allCategories.filter((category) => !isTestSlug(category.slug));

  const perCategory = await Promise.all(
    categories.map(async ({ slug }) => {
      const ranking = await loadRankingView(slug);
      return ranking ? loadCatalogPriceInfo(ranking) : [];
    }),
  );

  return perCategory.flat();
}

export default async function OffersPage() {
  const products = await loadAllCategoriesPriceInfo();
  const overview = buildOffersOverview(products);

  const hasAnything =
    overview.priceDrops.length > 0 ||
    overview.bestOpportunities.length > 0 ||
    overview.allTimeLows.length > 0 ||
    overview.recentCaptures.length > 0;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Ofertas", href: "/ofertas" },
        ])}
      />
      {overview.bestOpportunities.length > 0 ? (
        <JsonLd
          data={itemListSchema(
            overview.bestOpportunities.map((o) => ({
              name: o.entry.product.name,
              href: productDetailPath(o.entry.product.categorySlug, o.entry.product.slug),
            })),
          )}
        />
      ) : null}

      <PageHeader
        eyebrow="Inteligência de preço"
        title="Ofertas e quedas de preço"
        description="Quedas reais, oportunidades acima da média e capturas recentes — calculado a partir do histórico de preço de verdade, nunca estimado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Ofertas" }]}
      />

      {!hasAnything ? (
        <Section>
          <EmptyState
            icon={<Clock3 aria-hidden />}
            title="Ainda sem ofertas detectadas"
            description="O catálogo ainda tem pouco histórico de preço acumulado — volte em breve, conforme novas capturas forem registradas."
          />
        </Section>
      ) : (
        <>
          <Section className="border-border border-b">
            <div className="flex flex-col gap-6">
              <SectionTitle
                icon={<Star className="size-5" aria-hidden />}
                title="Melhores oportunidades"
                description="Maior Score Geral do ranking — combina qualidade (Índice SupleScore) com preço, preço por dose e preço por grama, ver docs/SCORING.md."
              />
              {overview.bestOpportunities.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {overview.bestOpportunities.map((info) => (
                    <OfferCard key={info.entry.product.id} info={info} />
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">
                  Nenhum produto está significativamente abaixo da média agora.
                </p>
              )}
            </div>
          </Section>

          <Section className="border-border border-b">
            <div className="flex flex-col gap-6">
              <SectionTitle
                icon={<TrendingDown className="size-5" aria-hidden />}
                title="Maiores quedas"
                description="Produtos cujo preço caiu na captura mais recente em relação à anterior."
              />
              {overview.priceDrops.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {overview.priceDrops.map((info) => (
                    <OfferCard key={info.entry.product.id} info={info} />
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">
                  Ainda não há capturas suficientes para detectar quedas de preço — precisa de pelo
                  menos 2 capturas por produto. Assim que houver, aparecem aqui automaticamente.
                </p>
              )}
            </div>
          </Section>

          <Section className="border-border border-b">
            <div className="flex flex-col gap-6">
              <SectionTitle
                icon={<Flame className="size-5" aria-hidden />}
                title="Menor preço histórico"
                description="Produtos no menor preço já registrado desde que começamos a acompanhar."
              />
              {overview.allTimeLows.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {overview.allTimeLows.map((info) => (
                    <OfferCard key={info.entry.product.id} info={info} />
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">
                  Nenhum produto tem histórico suficiente (mais de uma captura) para confirmar um
                  mínimo histórico ainda.
                </p>
              )}
            </div>
          </Section>

          <Section className="border-border border-b">
            <div className="flex flex-col gap-6">
              <SectionTitle
                icon={<TrendingDown className="size-5" aria-hidden />}
                title="Evolução de preços"
                description="Menor e maior preço já registrado, preço atual e tendência de cada produto — quando não há captura suficiente, isto é dito claramente, nunca uma variação inventada."
              />
              <PriceEvolutionTable products={products} />
            </div>
          </Section>

          <Section>
            <div className="flex flex-col gap-6">
              <SectionTitle
                icon={<Clock3 className="size-5" aria-hidden />}
                title="Capturas recentes"
                description="Últimos preços registrados no catálogo, mais recentes primeiro."
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overview.recentCaptures.map((info) => (
                  <OfferCard
                    key={info.entry.product.id}
                    info={info}
                    footer={
                      info.capturedAt
                        ? `Capturado em ${new Date(info.capturedAt).toLocaleDateString("pt-BR")}`
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-text flex items-center gap-2 text-xl font-bold">
        {icon}
        {title}
      </h2>
      <p className="text-text-muted text-sm">{description}</p>
    </div>
  );
}
