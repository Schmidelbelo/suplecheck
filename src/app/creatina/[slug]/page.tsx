import type { Metadata } from "next";
import Link from "next/link";
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
import {
  classificationBadgeVariant,
  classificationLabel,
} from "@/modules/evaluation/lib/classification";
import { criterionLabel } from "@/modules/evaluation/lib/criteria";
import { ScoreBreakdownList } from "@/modules/evaluation/components/ScoreBreakdownList";
import { ScoreHistoryList } from "@/modules/evaluation/components/ScoreHistoryList";
import type { ProductView } from "@/modules/evaluation/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadProduct(slug: string): Promise<ProductView | null> {
  return fetchApiOrNull<ProductView>(`/api/evaluation/products/${slug}/view`);
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
  const view = await loadProduct(slug);
  if (!view) notFound();

  const { product, presentation, score, history, ranking } = view;

  return (
    <>
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

      <Section className="border-border border-b">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <img
            src={presentation?.imageUrl ?? "/images/products/creatina-placeholder.svg"}
            alt={product.name}
            className="border-border bg-bg-subtle size-full max-h-60 rounded-lg border object-cover"
          />

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

            {ranking ? (
              <Link
                href="/creatina"
                className="text-brand w-fit text-sm font-medium hover:underline"
              >
                #{ranking.position} de {ranking.total} no ranking de creatina
              </Link>
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
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <a
                      href={presentation.price.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Ver oferta em {presentation.price.store.name}
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="lg" disabled>
                Nenhuma oferta cadastrada
              </Button>
            )}
          </div>
        </div>
      </Section>

      {score ? (
        <Section className="border-border border-b">
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

      <Section className="border-border border-b">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="font-display text-text text-2xl font-bold">Histórico de avaliação</h2>
          <ScoreHistoryList history={history} />
        </div>
      </Section>

      <Section>
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
    </>
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
