import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ShareButton } from "@/modules/sharing/components/ShareButton";
import { formatCurrencyBRL } from "@/lib/utils/format";
import {
  classificationBadgeVariant,
  classificationLabel,
} from "@/modules/evaluation/lib/classification";
import { getComparisonPageView } from "@/modules/comparison/services/comparisonPage.service";
import type { RankingViewEntry } from "@/modules/evaluation/types";

type Params = { params: Promise<{ pair: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pair } = await params;
  const view = await getComparisonPageView(pair);
  if (!view) {
    return buildMetadata({
      title: "Comparacao nao encontrada",
      path: `/comparar/${pair}`,
      noIndex: true,
    });
  }

  const { productA, productB } = view.data;
  return buildMetadata({
    title: `${productA.product.name} vs ${productB.product.name}`,
    description: `Compare ${productA.product.name} e ${productB.product.name}: score, preco, criterios, vantagens, desvantagens e conclusao com dados reais do SupleCheck.`,
    path: `/comparar/${view.canonicalPair}`,
  });
}

export default async function ComparisonPage({ params }: Params) {
  const { pair } = await params;
  const view = await getComparisonPageView(pair);
  if (!view) notFound();
  if (view.pair !== view.canonicalPair) redirect(`/comparar/${view.canonicalPair}`);

  const { productA, productB, narrative, criteriaDiff, advantagesA, advantagesB, winner } =
    view.data;
  const winnerName =
    winner === "tie"
      ? "Empate tecnico"
      : winner === "a"
        ? productA.product.name
        : productB.product.name;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Comparar", href: "/comparar" },
          {
            label: `${productA.product.name} vs ${productB.product.name}`,
            href: `/comparar/${pair}`,
          },
        ])}
      />
      <JsonLd
        data={itemListSchema([
          { name: productA.product.name, href: `/creatina/${productA.product.slug}` },
          { name: productB.product.name, href: `/creatina/${productB.product.slug}` },
        ])}
      />

      <PageHeader
        eyebrow="Comparacao"
        title={`${productA.product.name} vs ${productB.product.name}`}
        description={`Score, preco, criterios e conclusao calculados a partir das avaliacoes reais do SupleCheck.`}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Comparar" },
          { label: `${productA.product.name} vs ${productB.product.name}` },
        ]}
      />

      <Section className="border-border border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-text-muted text-sm">Conclusao</p>
            <p className="text-text text-2xl font-bold">{winnerName}</p>
          </div>
          <ShareButton
            title={`${productA.product.name} vs ${productB.product.name}`}
            text="Comparacao SupleCheck"
            label="Compartilhar comparacao"
          />
        </div>
      </Section>

      <Section className="border-border border-b">
        <div className="grid gap-4 md:grid-cols-2">
          <ComparisonProductCard entry={productA} highlighted={winner === "a"} />
          <ComparisonProductCard entry={productB} highlighted={winner === "b"} />
        </div>
      </Section>

      <Section className="border-border border-b">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ProsCons title={`Vantagens de ${productA.product.name}`} items={advantagesA} />
          <ProsCons title={`Vantagens de ${productB.product.name}`} items={advantagesB} />
        </div>
      </Section>

      <Section className="border-border border-b">
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-subtle text-text-muted">
              <tr>
                <th className="px-4 py-3">Criterio</th>
                <th className="px-4 py-3">{productA.product.name}</th>
                <th className="px-4 py-3">{productB.product.name}</th>
                <th className="px-4 py-3">Melhor</th>
              </tr>
            </thead>
            <tbody>
              {criteriaDiff.map((row) => (
                <tr key={row.criterionId} className="border-border border-t">
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3 tabular-nums">{formatScore(row.scoreA)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatScore(row.scoreB)}</td>
                  <td className="px-4 py-3">
                    {row.winner === "tie" || row.winner == null
                      ? "Empate"
                      : row.winner === "a"
                        ? productA.product.name
                        : productB.product.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h2 className="font-display text-text text-2xl font-bold">Conclusao completa</h2>
          {narrative.map((line) => (
            <p key={line} className="text-text-muted">
              {line}
            </p>
          ))}
          <Link
            href="/creatina"
            className="text-brand inline-flex w-fit items-center gap-2 text-sm font-medium hover:underline"
          >
            Ver ranking da categoria <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Section>
    </>
  );
}

function ComparisonProductCard({
  entry,
  highlighted,
}: {
  entry: RankingViewEntry;
  highlighted: boolean;
}) {
  return (
    <Card className={highlighted ? "border-brand" : undefined}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-text text-xl font-bold">{entry.product.name}</h2>
            <p className="text-text-muted text-sm">{entry.product.brand.name}</p>
          </div>
          {highlighted ? <Badge variant="brand">Melhor score</Badge> : null}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Score" value={entry.overallScore.toFixed(1)} />
          <Metric label="Indice" value={entry.finalScore.toFixed(1)} />
          <Metric
            label="Preco"
            value={entry.product.price ? formatCurrencyBRL(entry.product.price.cents) : "-"}
          />
        </div>
        <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
          {classificationLabel(entry.classificationTier)}
        </Badge>
        <Link
          href={`/creatina/${entry.product.slug}`}
          className="text-brand text-sm font-medium hover:underline"
        >
          Ver analise do produto
        </Link>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-subtle text-xs uppercase">{label}</p>
      <p className="text-text font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ProsCons({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h2 className="text-text mb-3 text-xl font-bold">{title}</h2>
      {items.length > 0 ? (
        <ul className="text-text-muted space-y-2 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted text-sm">
          Nenhuma vantagem numerica exclusiva nos criterios avaliados.
        </p>
      )}
    </div>
  );
}

function formatScore(value: number | null): string {
  return value == null ? "-" : value.toFixed(1);
}
