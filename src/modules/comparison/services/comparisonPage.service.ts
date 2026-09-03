import { prisma } from "@/lib/db/prisma";
import { loadRankingView } from "@/modules/evaluation/services/rankingView.service";
import type { RankingViewEntry } from "@/modules/evaluation/types";
import { buildComparisonPageData } from "../lib/buildComparisonPage";
import { decodeComparisonSlug, encodeComparisonSlug } from "../lib/comparisonSlug";

export interface ComparisonPageView {
  readonly pair: string;
  readonly canonicalPair: string;
  readonly categorySlug: string;
  readonly data: ReturnType<typeof buildComparisonPageData>;
}

export async function listComparableProductSlugs(): Promise<readonly string[]> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  return products.map((product) => product.slug);
}

export async function listComparisonSitemapEntries(): Promise<
  readonly { readonly pair: string; readonly updatedAt: Date }[]
> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, category: { select: { slug: true } }, updatedAt: true },
    orderBy: { slug: "asc" },
  });

  const byCategory = new Map<string, typeof products>();
  for (const product of products) {
    const list = byCategory.get(product.category.slug) ?? [];
    list.push(product);
    byCategory.set(product.category.slug, list);
  }

  const entries: { pair: string; updatedAt: Date }[] = [];
  for (const categoryProducts of byCategory.values()) {
    for (let i = 0; i < categoryProducts.length; i += 1) {
      for (let j = i + 1; j < categoryProducts.length; j += 1) {
        const a = categoryProducts[i]!;
        const b = categoryProducts[j]!;
        entries.push({
          pair: encodeComparisonSlug(a.slug, b.slug),
          updatedAt: a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt,
        });
      }
    }
  }
  return entries;
}

export async function getComparisonPageView(pair: string): Promise<ComparisonPageView | null> {
  const knownSlugs = await listComparableProductSlugs();
  const decoded = decodeComparisonSlug(pair, knownSlugs);
  if (!decoded) return null;

  const [slugA, slugB] = decoded;
  const products = await prisma.product.findMany({
    where: { slug: { in: [slugA, slugB] }, status: "PUBLISHED" },
    select: { slug: true, category: { select: { slug: true } } },
  });
  if (products.length !== 2) return null;

  const categories = new Set(products.map((product) => product.category.slug));
  if (categories.size !== 1) return null;

  const categorySlug = products[0]!.category.slug;
  const ranking = await loadRankingView(categorySlug);
  if (!ranking) return null;

  const bySlug = new Map<string, RankingViewEntry>(
    ranking.entries.map((entry) => [entry.product.slug, entry]),
  );
  const productA = bySlug.get(slugA);
  const productB = bySlug.get(slugB);
  if (!productA || !productB) return null;

  return {
    pair,
    canonicalPair: encodeComparisonSlug(slugA, slugB),
    categorySlug,
    data: buildComparisonPageData(productA, productB),
  };
}
