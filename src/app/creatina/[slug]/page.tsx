import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema, productSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
  classificationBadgeVariant,
  classificationLabel,
} from "@/modules/evaluation/lib/classification";
import { criterionLabel } from "@/modules/evaluation/lib/criteria";
import { ScoreBreakdownList } from "@/modules/evaluation/components/ScoreBreakdownList";
import { ScoreHistoryList } from "@/modules/evaluation/components/ScoreHistoryList";
import { FavoriteButton } from "@/modules/evaluation/components/FavoriteButton";
import { ProductSummary } from "@/modules/evaluation/components/ProductSummary";
import { ProductHighlightBadges } from "@/modules/evaluation/components/ProductHighlightBadges";
import { RecordProductVisit } from "@/modules/evaluation/components/RecordProductVisit";
import type { ProductView, RankingView, RankingViewEntry } from "@/modules/evaluation/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadProduct(slug: string): Promise<ProductView | null> {
  return fetchApiOrNull<ProductView>(`/api/evaluation/products/${slug}/view`);
}

function pickRelatedProducts(
  ranking: RankingView,
  currentSlug: string,
): readonly RankingViewEntry[] {
  const currentIndex = ranking.entries.findIndex((e) => e.product.slug === currentSlug);
  const others = ranking.entries.filter((e) => e.product.slug !== currentSlug);

  if (currentIndex === -1) return others.slice(0, 3);

  // Vizinhos mais próximos no ranking (acima e abaixo) — produtos de
  // nível de nota parecido são a comparação mais útil, não só "os 3
  // primeiros do ranking" repetidos em toda página de produto.
  return [...others]
    .sort(
      (a, b) =>
        Math.abs(a.position - ranking.entries[currentIndex]!.position) -
        Math.abs(b.position - ranking.entries[currentIndex]!.position),
    )
    .slice(0, 3)
    .sort((a, b) => a.position - b.position);
}

interface CategoryAverages {
  readonly score: number;
  readonly priceCents: number | null;
  readonly count: number;
}

function categoryAverages(ranking: RankingView): CategoryAverages {
  const prices = ranking.entries
    .map((e) => e.product.price?.cents)
    .filter((v): v is number => v != null);

  return {
    score: ranking.entries.reduce((sum, e) => sum + e.finalScore, 0) / ranking.entries.length,
    priceCents: prices.length > 0 ? prices.reduce((sum, v) => sum + v, 0) / prices.length : null,
    count: ranking.entries.length,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const view = await loadProduct(slug);
  if (!view)
    return buildMetadata({
      title: "Produto não encontrado",
      path: `/creatina/${slug}`,
      noIndex: true,
    });

  return buildMetadata({
    title: view.product.name,
    description: view.score
      ? `${view.product.name}: nota ${view.score.finalScore.toFixed(1)} no Índice SupleCheck (${classificationLabel(view.score.classificationTier)}).`
      : `Detalhes de ${view.product.name} no SupleCheck.`,
    path: `/creatina/${slug}`,
  });
}

/** Descrição gerada só a partir de dados reais persistidos — nunca texto editorial inventado. */
function buildProductDescription(view: ProductView): string {
  const { product, presentation, score } = view;
  const parts: string[] = [
    `${product.name}${presentation ? ` da ${presentation.brand.name}` : ""}.`,
  ];

  if (score) {
    parts.push(
      `Nota ${score.finalScore.toFixed(1)} no Índice SupleCheck (${classificationLabel(score.classificationTier)}).`,
    );
  }
  if (presentation?.price) {
    parts.push(`Preço: ${formatCurrencyBRL(presentation.price.cents)}.`);
  }

  return parts.join(" ");
}

function explainScore(view: ProductView): string {
  if (!view.score) return "Este produto ainda não foi avaliado pelo Índice SupleCheck.";

  const top = [...view.score.breakdown].sort((a, b) => b.weight * b.score - a.weight * a.score)[0];
  const label = classificationLabel(view.score.classificationTier).toLowerCase();

  const base = `Este produto recebeu nota ${view.score.finalScore.toFixed(1)} de 100, classificação "${label}".`;
  if (!top) return base;
  return `${base} O critério que mais influenciou a nota foi ${criterionLabel(top.criterionId)}, com pontuação ${top.score.toFixed(1)}.`;
}

export default async function CreatinaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [view, categoryRanking] = await Promise.all([
    loadProduct(slug),
    fetchApiOrNull<RankingView>("/api/evaluation/rankings/creatina/view"),
  ]);
  if (!view) notFound();

  const { product, presentation, score, history, ranking } = view;
  const relatedProducts = categoryRanking ? pickRelatedProducts(categoryRanking, slug) : [];
  const averages = categoryRanking ? categoryAverages(categoryRanking) : null;

  return (
    <>
      <RecordProductVisit slug={slug} />
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Creatina", href: "/creatina" },
          { label: product.name, href: `/creatina/${slug}` },
        ])}
      />
      <JsonLd
        data={productSchema({
          name: product.name,
          description: buildProductDescription(view),
          image: presentation?.imageUrl ?? "/images/products/creatina-placeholder.svg",
          slug: product.slug,
          brand: presentation?.brand.name ?? product.brandSlug,
          score: score
            ? {
                value: score.finalScore,
                label: classificationLabel(score.classificationTier),
                calculatedAt: score.calculatedAt,
              }
            : undefined,
          priceInCents: presentation?.price?.cents,
          offerUrl: presentation?.price?.url ?? undefined,
        })}
      />
      <PageHeader
        eyebrow={presentation?.brand.name}
        title={product.name}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Creatina", href: "/creatina" },
          { label: product.name },
        ]}
      />

      <ProductPageNav
        hasScore={!!score}
        hasTechnicalInfo
        hasComparison={!!averages}
        hasRelated={relatedProducts.length > 0}
      />

      <Section id="visao-geral" className="border-border scroll-mt-20 border-b">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <div className="border-border bg-bg-subtle relative h-60 w-full overflow-hidden rounded-lg border">
            <Image
              src={presentation?.imageUrl ?? "/images/products/creatina-placeholder.svg"}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 240px, 100vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col gap-6">
            {score ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-text text-4xl font-bold tabular-nums">
                  {score.finalScore.toFixed(1)}
                </span>
                <Badge variant={classificationBadgeVariant(score.classificationTier)}>
                  {classificationLabel(score.classificationTier)}
                </Badge>
                <span className="text-text-muted text-sm">Índice SupleCheck</span>
              </div>
            ) : (
              <Badge variant="outline">Ainda não avaliado</Badge>
            )}

            {score ? <ProductHighlightBadges score={score} /> : null}

            {ranking ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/creatina"
                  className="text-brand w-fit text-sm font-medium hover:underline"
                >
                  #{ranking.position} de {ranking.total} no ranking de creatina
                </Link>
                {ranking.position === 1 ? <Badge variant="success">Nº1 do ranking</Badge> : null}
              </div>
            ) : null}

            <p className="text-text-muted">{explainScore(view)}</p>

            {presentation?.price ? (
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-text text-2xl font-bold">
                    {formatCurrencyBRL(presentation.price.cents)}
                  </p>
                  {presentation.price.pricePerDoseCents != null ? (
                    <p className="text-text-muted text-sm">
                      {formatCurrencyBRL(presentation.price.pricePerDoseCents)} por dose ·{" "}
                      {presentation.price.store.name}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <a
                      href={presentation.price.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Ver oferta em {presentation.price.store.name}
                    </a>
                  </Button>
                  <FavoriteButton productId={product.id} productName={product.name} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="lg" disabled>
                  Nenhuma oferta cadastrada
                </Button>
                <FavoriteButton productId={product.id} productName={product.name} />
              </div>
            )}
          </div>
        </div>
      </Section>

      {score ? (
        <Section className="border-border border-b">
          <div className="mx-auto max-w-3xl">
            <ProductSummary score={score} />
          </div>
        </Section>
      ) : null}

      {score ? (
        <Section id="pontuacao" className="border-border scroll-mt-20 border-b">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-text text-2xl font-bold">Critérios utilizados</h2>
              <Link
                href="/metodologia"
                className="text-text-subtle text-xs font-medium hover:underline"
              >
                Metodologia v{score.methodologyVersion}
              </Link>
            </div>
            <ScoreBreakdownList breakdown={score.breakdown} />
          </div>
        </Section>
      ) : null}

      {averages ? (
        <Section id="comparacao" className="border-border scroll-mt-20 border-b">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <h2 className="font-display text-text text-2xl font-bold">
              Como este produto se compara à categoria
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <CategoryComparisonStat
                label="Índice SupleCheck"
                productValue={score ? score.finalScore.toFixed(1) : "—"}
                categoryValue={averages.score.toFixed(1)}
                isBetter={score ? score.finalScore >= averages.score : null}
              />
              <CategoryComparisonStat
                label="Preço"
                productValue={
                  presentation?.price ? formatCurrencyBRL(presentation.price.cents) : "—"
                }
                categoryValue={
                  averages.priceCents != null ? formatCurrencyBRL(averages.priceCents) : "—"
                }
                isBetter={
                  presentation?.price && averages.priceCents != null
                    ? presentation.price.cents <= averages.priceCents
                    : null
                }
              />
            </div>
            <p className="text-text-subtle text-xs">
              Média calculada sobre os {averages.count} produtos avaliados no ranking de creatina.
            </p>
          </div>
        </Section>
      ) : null}

      <Section id="avaliacao" className="border-border scroll-mt-20 border-b">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="font-display text-text text-2xl font-bold">Histórico de avaliação</h2>
          <ScoreHistoryList history={history} />
        </div>
      </Section>

      <Section id="informacoes-tecnicas" className="scroll-mt-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="font-display text-text text-2xl font-bold">Informações técnicas</h2>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-6 text-sm sm:grid-cols-3">
              <TechInfo
                label="Categoria"
                value={presentation?.categorySlug ?? product.categorySlug}
              />
              <TechInfo label="Marca" value={presentation?.brand.name ?? product.brandSlug} />
              <TechInfo label="Fabricante" value={presentation?.manufacturer?.name ?? "—"} />
              <TechInfo label="Variante" value={presentation?.sku?.variantLabel ?? "—"} />
              <TechInfo
                label="Porções"
                value={
                  presentation?.sku?.servingsPerUnit ? `${presentation.sku.servingsPerUnit}` : "—"
                }
              />
              <TechInfo
                label="Dose por porção"
                value={
                  presentation?.sku?.dosagePerServing
                    ? `${presentation.sku.dosagePerServing}g`
                    : "—"
                }
              />
            </CardContent>
          </Card>

          <Link
            href="/creatina"
            className="text-brand inline-flex w-fit items-center gap-2 text-sm font-medium hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Ver todos os produtos do ranking de creatina
          </Link>
        </div>
      </Section>

      {relatedProducts.length > 0 ? (
        <Section id="relacionados" className="border-border bg-bg-subtle scroll-mt-20 border-t">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <h2 className="font-display text-text text-2xl font-bold">Produtos parecidos</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedProducts.map((entry) => (
                <RelatedProductCard key={entry.product.id} entry={entry} />
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {presentation?.price ? (
        <div className="border-border bg-surface-raised fixed inset-x-0 bottom-0 z-(--z-overlay) border-t p-3 shadow-lg md:hidden">
          <Button asChild size="lg" className="w-full">
            <a
              href={presentation.price.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Ver oferta em {presentation.price.store.name} ·{" "}
              {formatCurrencyBRL(presentation.price.cents)}
            </a>
          </Button>
        </div>
      ) : null}
      {/* Espaço reservado para a barra fixa acima não sobrepor o rodapé no mobile. */}
      {presentation?.price ? <div className="h-20 md:hidden" aria-hidden /> : null}
    </>
  );
}

function RelatedProductCard({ entry }: { entry: RankingViewEntry }) {
  return (
    <Link href={`/creatina/${entry.product.slug}`}>
      <Card className="hover:border-border-strong flex h-full flex-col gap-3 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
        <Image
          src={entry.product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
          alt={entry.product.name}
          width={64}
          height={64}
          className="border-border bg-bg-subtle size-16 rounded-md border object-cover"
        />
        <div className="flex-1">
          <p className="text-text-muted text-xs font-medium tracking-wide uppercase">
            {entry.product.brand.name}
          </p>
          <p className="text-text line-clamp-2 text-sm font-semibold">{entry.product.name}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text text-lg font-bold tabular-nums">
            {entry.finalScore.toFixed(1)}
          </span>
          <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
            {classificationLabel(entry.classificationTier)}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}

function TechInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted text-xs tracking-wide uppercase">{label}</p>
      <p className="text-text font-medium">{value}</p>
    </div>
  );
}

function CategoryComparisonStat({
  label,
  productValue,
  categoryValue,
  isBetter,
}: {
  label: string;
  productValue: string;
  categoryValue: string;
  isBetter: boolean | null;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-text-subtle text-xs">Este produto</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                isBetter === true && "text-success",
                isBetter === false && "text-danger",
              )}
            >
              {productValue}
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-subtle text-xs">Média da categoria</p>
            <p className="text-text-muted text-lg font-semibold tabular-nums">{categoryValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TOC_ITEMS = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "pontuacao", label: "Pontuação", requires: "hasScore" as const },
  { id: "comparacao", label: "Comparação", requires: "hasComparison" as const },
  { id: "avaliacao", label: "Avaliação" },
  {
    id: "informacoes-tecnicas",
    label: "Informações técnicas",
    requires: "hasTechnicalInfo" as const,
  },
  { id: "relacionados", label: "Relacionados", requires: "hasRelated" as const },
];

/**
 * Índice "Nesta página" — só âncoras (`<a href="#...">`), sem
 * `IntersectionObserver`/estado de seção ativa: prioriza zero
 * JavaScript de cliente sobre a conveniência de destacar a seção atual
 * durante o scroll. Renderizado como Server Component.
 */
function ProductPageNav({
  hasScore,
  hasComparison,
  hasTechnicalInfo,
  hasRelated,
}: {
  hasScore: boolean;
  hasComparison: boolean;
  hasTechnicalInfo: boolean;
  hasRelated: boolean;
}) {
  const flags = { hasScore, hasComparison, hasTechnicalInfo, hasRelated };
  const items = TOC_ITEMS.filter((item) => !item.requires || flags[item.requires]);

  return (
    <nav
      aria-label="Nesta página"
      className="bg-bg/95 border-border sticky top-16 z-(--z-sticky) -mx-4 overflow-x-auto border-b px-4 py-2 backdrop-blur sm:mx-0 sm:px-6"
    >
      <ul className="mx-auto flex max-w-3xl gap-4 text-sm whitespace-nowrap">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-text-muted hover:text-brand transition-colors">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
