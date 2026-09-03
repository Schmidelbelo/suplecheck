import { container } from "@/lib/container";
import {
  getMarketOverview,
  getProductsByBrand,
  type EnrichedProduct,
} from "@/modules/market/services/marketData.service";
import type { BrandRankingEntry } from "@core/index";

export interface BrandPageData {
  readonly brand: { readonly slug: string; readonly name: string; readonly logoUrl: string | null };
  readonly stats: BrandRankingEntry | null;
  readonly products: readonly EnrichedProduct[];
}

/**
 * Dados de `/marcas/[slug]` — a marca em si vem do catálogo (existe
 * mesmo sem nenhum produto avaliado ainda), estatísticas/produtos vêm
 * do `marketData.service` (mesma base de `/mercado`). `null` só quando
 * a marca não existe de verdade no catálogo — uma marca real sem
 * produto avaliado ainda tem página, só sem estatísticas.
 */
export async function getBrandPageData(slug: string): Promise<BrandPageData | null> {
  const brand = await container.ports.brands.findBySlug(slug);
  if (!brand || !brand.active) return null;

  const [overview, products] = await Promise.all([getMarketOverview(), getProductsByBrand(slug)]);
  const stats = overview?.brandRanking.find((entry) => entry.brandId === slug) ?? null;

  return {
    brand: { slug: brand.slug, name: brand.name, logoUrl: brand.logoUrl ?? null },
    stats,
    products,
  };
}

export interface BrandListEntry {
  readonly slug: string;
  readonly name: string;
  readonly stats: BrandRankingEntry | null;
}

/** Todas as marcas ativas do catálogo, com estatísticas quando existirem — base de `/marcas`. */
export async function listBrandsWithStats(): Promise<readonly BrandListEntry[]> {
  const [brands, overview] = await Promise.all([
    container.ports.brands.listAll(),
    getMarketOverview(),
  ]);
  const statsBySlug = new Map(overview?.brandRanking.map((entry) => [entry.brandId, entry]) ?? []);

  return brands
    .filter((b) => b.active)
    .map((b) => ({ slug: b.slug, name: b.name, stats: statsBySlug.get(b.slug) ?? null }))
    .sort((a, b) => (b.stats?.productCount ?? 0) - (a.stats?.productCount ?? 0));
}
