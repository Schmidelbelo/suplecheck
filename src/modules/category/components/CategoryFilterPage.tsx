import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/layout/Section";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { productDetailPath, categoryBasePath } from "@/lib/catalog/productRoutes";
import { loadRankingView } from "@/modules/evaluation/services/rankingView.service";
import { prisma } from "@/lib/db/prisma";
import type { RankingViewEntry } from "@/modules/evaluation/types";

/**
 * Regra editorial já documentada em `docs/INVENTARIO_CONTEUDO_FUTURO.md`
 * ("Ter pelo menos 8 produtos reais na categoria") — nunca gera uma
 * página de superlativo ("melhor X", "mais barato") com catálogo
 * pequeno demais para a comparação fazer sentido. Aplicada aqui em
 * código, não só em texto de planejamento.
 */
export const MIN_PRODUCTS_FOR_FILTER_PAGE = 8;

export type CategoryFilterKind =
  "custo-beneficio" | "preco-por-dose" | "mais-vendidos" | "mais-bem-avaliados";

const FILTER_META: Record<
  CategoryFilterKind,
  { label: string; title: (categoryName: string) => string; description: string }
> = {
  "custo-beneficio": {
    label: "Melhor Custo-Benefício",
    title: (c) => `Melhor ${c} Custo-Benefício`,
    description:
      "Ordenado pelo Score Geral (qualidade do Índice SupleScore combinada com preço, preço por dose e preço por grama) — nunca só o mais barato, nunca só a maior nota isolada.",
  },
  "preco-por-dose": {
    label: "Menor Preço por Dose",
    title: (c) => `${c}: Menor Preço por Dose`,
    description:
      "Ordenado pelo preço por dose real, calculado a partir da dose declarada no rótulo e do preço mais recente capturado — nunca preço por pote, que engana quando o rendimento muda.",
  },
  "mais-vendidos": {
    label: "Mais Vendidos",
    title: (c) => `${c} Mais Vendidos`,
    description:
      'Ordenado pelo número real de cliques em "Ver oferta" registrados no SupleScore para cada produto — o sinal de interesse mais próximo de vendas que temos sem acesso aos dados de venda reais das lojas.',
  },
  "mais-bem-avaliados": {
    label: "Mais Bem Avaliados",
    title: (c) => `${c}: Mais Bem Avaliados`,
    description:
      "Ordenado pela nota do Índice SupleScore — custo-benefício, transparência do rótulo, reputação e confiabilidade da loja, calculado sem posição paga.",
  },
};

async function sortEntries(
  filter: CategoryFilterKind,
  entries: readonly RankingViewEntry[],
): Promise<readonly RankingViewEntry[]> {
  if (filter === "custo-beneficio") {
    return [...entries].sort((a, b) => b.overallScore - a.overallScore);
  }
  if (filter === "mais-bem-avaliados") {
    return [...entries].sort((a, b) => b.finalScore - a.finalScore);
  }
  if (filter === "preco-por-dose") {
    return [...entries]
      .filter((e) => e.product.price?.pricePerDoseCents != null)
      .sort((a, b) => a.product.price!.pricePerDoseCents! - b.product.price!.pricePerDoseCents!);
  }
  // mais-vendidos: conta real de OutboundClick por produto, nunca dado inventado.
  const clickCounts = await prisma.outboundClick.groupBy({
    by: ["productId"],
    where: { productId: { in: entries.map((e) => e.product.id) } },
    _count: { _all: true },
  });
  const countsByProductId = new Map(clickCounts.map((row) => [row.productId, row._count._all]));
  return [...entries].sort(
    (a, b) =>
      (countsByProductId.get(b.product.id) ?? 0) - (countsByProductId.get(a.product.id) ?? 0),
  );
}

export interface CategoryFilterPageProps {
  readonly categorySlug: string;
  readonly categoryName: string;
  readonly filter: CategoryFilterKind;
  readonly path: string;
}

export async function CategoryFilterPage({
  categorySlug,
  categoryName,
  filter,
  path,
}: CategoryFilterPageProps) {
  const ranking = await loadRankingView(categorySlug);
  if (!ranking || ranking.entries.length < MIN_PRODUCTS_FOR_FILTER_PAGE) notFound();

  const meta = FILTER_META[filter];
  const sorted = await sortEntries(filter, ranking.entries);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: categoryName, href: categoryBasePath(categorySlug) },
          { label: meta.label, href: path },
        ])}
      />
      <JsonLd
        data={itemListSchema(
          sorted.slice(0, 20).map((entry) => ({
            name: entry.product.name,
            href: productDetailPath(entry.product.categorySlug, entry.product.slug),
          })),
        )}
      />
      <PageHeader
        eyebrow={categoryName}
        title={meta.title(categoryName)}
        description={meta.description}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: categoryName, href: categoryBasePath(categorySlug) },
          { label: meta.label },
        ]}
      />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((entry, index) => (
            <Card key={entry.product.id} className="p-4">
              <Link href={productDetailPath(entry.product.categorySlug, entry.product.slug)}>
                <span className="text-text-subtle mb-2 block text-xs font-semibold">
                  #{index + 1}
                </span>
                <ProductMiniCard
                  imageUrl={entry.product.imageUrl}
                  name={entry.product.name}
                  brandName={entry.product.brand.name}
                  priceCents={entry.product.price?.cents ?? null}
                  classificationTier={entry.classificationTier}
                  score={entry.finalScore}
                />
              </Link>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
