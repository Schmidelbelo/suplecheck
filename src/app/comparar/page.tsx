import type { Metadata } from "next";
import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { loadRankingView } from "@/modules/evaluation/services/rankingView.service";
import { encodeComparisonSlug } from "@/modules/comparison/lib/comparisonSlug";

export const metadata: Metadata = buildMetadata({
  title: "Comparar Produtos de Creatina",
  description:
    "Comparações lado a lado entre os produtos de creatina mais bem avaliados do SupleCheck — score, preço, critérios e conclusão calculados a partir de dados reais.",
  path: "/comparar",
});

export const revalidate = 300;

/** Nº de produtos do topo do ranking usados para gerar as "comparações em destaque" — combinação completa entre eles, não uma seleção arbitrária. */
const TOP_N = 5;

export default async function ComparisonsIndexPage() {
  const ranking = await loadRankingView("creatina");
  const top = ranking ? [...ranking.entries].sort((a, b) => a.position - b.position).slice(0, TOP_N) : [];

  const pairs: { label: string; href: string }[] = [];
  for (let i = 0; i < top.length; i += 1) {
    for (let j = i + 1; j < top.length; j += 1) {
      const a = top[i]!;
      const b = top[j]!;
      pairs.push({
        label: `${a.product.name} vs ${b.product.name}`,
        href: `/comparar/${encodeComparisonSlug(a.product.slug, b.product.slug)}`,
      });
    }
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Comparar", href: "/comparar" },
        ])}
      />
      {pairs.length > 0 ? (
        <JsonLd data={itemListSchema(pairs.map((p) => ({ name: p.label, href: p.href })))} />
      ) : null}

      <PageHeader
        eyebrow="Comparações"
        title="Comparar produtos de creatina"
        description="Comparações completas entre os produtos mais bem avaliados — score, preço, diferença critério a critério e conclusão, calculados a partir de dados reais."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Comparar" }]}
      />

      <Section>
        {pairs.length === 0 ? (
          <EmptyState
            icon={<GitCompareArrows aria-hidden />}
            title="Ainda não há produtos suficientes para comparar"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map((pair) => (
              <Link key={pair.href} href={pair.href}>
                <Card className="hover:border-border-strong flex h-full items-center gap-3 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
                  <CardContent className="flex items-center gap-2 p-0">
                    <GitCompareArrows className="text-brand size-4 shrink-0" aria-hidden />
                    <span className="text-text text-sm font-medium">{pair.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
