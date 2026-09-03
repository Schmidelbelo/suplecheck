import { container } from "@/lib/container";
import {
  getCategoryMarketView,
  getProductsByCategory,
  type EnrichedProduct,
} from "@/modules/market/services/marketData.service";
import type { CategoryStatistics } from "@core/index";

export interface CategoryPageData {
  readonly category: { readonly slug: string; readonly name: string; readonly description: string | null };
  readonly statistics: CategoryStatistics | null;
  readonly insights: readonly string[];
  readonly products: readonly EnrichedProduct[];
}

/** Dados de `/categorias/[slug]` — categoria real do catálogo, com ou sem produto avaliado ainda. */
export async function getCategoryPageData(slug: string): Promise<CategoryPageData | null> {
  const category = await container.ports.categories.findBySlug(slug);
  if (!category || !category.active) return null;

  const [view, products] = await Promise.all([
    getCategoryMarketView(slug),
    getProductsByCategory(slug),
  ]);

  return {
    category: { slug: category.slug, name: category.name, description: category.description ?? null },
    statistics: view?.statistics ?? null,
    insights: view?.insights ?? [],
    products,
  };
}

export interface CategoryListEntry {
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly productCount: number;
}

/** Todas as categorias ativas do catálogo — base de `/categorias`. */
export async function listCategoriesWithCounts(): Promise<readonly CategoryListEntry[]> {
  const categories = await container.ports.categories.listAll();
  const withCounts = await Promise.all(
    categories
      .filter((c) => c.active)
      .map(async (c) => {
        const products = await getProductsByCategory(c.slug);
        return {
          slug: c.slug,
          name: c.name,
          description: c.description ?? null,
          productCount: products.length,
        };
      }),
  );
  return withCounts.sort((a, b) => b.productCount - a.productCount);
}
