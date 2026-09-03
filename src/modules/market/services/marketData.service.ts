import { container, rankingService } from "@/lib/container";
import { productViewService } from "@/modules/evaluation/services/productView.service";
import { formatCurrencyBRL } from "@/lib/utils/format";
import {
  calculateOverallScores,
  calculateMarketStatistics,
  rankBrands,
  calculateCategoryStatistics,
  generateMarketInsights,
  type MarketStatistics,
  type BrandRankingEntry,
  type CategoryStatistics,
} from "@core/index";

export interface EnrichedProduct {
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly imageUrl: string | null;
  readonly brandId: string;
  readonly brandName: string;
  readonly categorySlug: string;
  readonly priceCents: number | null;
  readonly finalScore: number;
  readonly overallScore: number;
  readonly classificationTier: string;
}

/**
 * Última avaliação de cada produto do catálogo inteiro, enriquecida com
 * apresentação (marca/preço) e Score Geral — o Score Geral é calculado
 * POR CATEGORIA (agrupado antes de chamar `calculateOverallScores`),
 * nunca misturando categorias no mesmo conjunto comparável: preço só
 * tem sentido relativo dentro do mesmo tipo de produto (ver
 * docs/SCORING.md). Uma consulta agregada (`listLatestForAllProducts`,
 * groupBy + `_max`) e uma busca de apresentações em lote — nunca uma
 * consulta por produto.
 */
async function loadEnrichedCatalog(): Promise<EnrichedProduct[]> {
  const indexResults = await container.ports.indexResults.listLatestForAllProducts();
  if (indexResults.length === 0) return [];

  const presentations = await productViewService.loadPresentations(
    indexResults.map((r) => r.supplementId),
  );

  const byCategory = new Map<string, typeof indexResults>();
  for (const result of indexResults) {
    const list = byCategory.get(result.categorySlug) ?? [];
    list.push(result);
    byCategory.set(result.categorySlug, list);
  }

  const enriched: EnrichedProduct[] = [];
  for (const results of byCategory.values()) {
    const withPresentation = results
      .map((result) => ({ result, presentation: presentations.get(result.supplementId) }))
      .filter(
        (
          v,
        ): v is {
          result: (typeof results)[number];
          presentation: NonNullable<typeof v.presentation>;
        } => v.presentation !== undefined,
      );

    const overallScores = calculateOverallScores(
      withPresentation.map(({ result, presentation }) => ({
        productId: result.supplementId,
        qualityScore: result.finalScore,
        priceCents: presentation.price?.cents ?? null,
        pricePerDoseCents: presentation.price?.pricePerDoseCents ?? null,
        pricePerGramCents: presentation.price?.pricePerGramCents ?? null,
      })),
    );
    const overallByProduct = new Map(overallScores.map((r) => [r.productId, r.overallScore]));

    for (const { result, presentation } of withPresentation) {
      enriched.push({
        productId: result.supplementId,
        productSlug: presentation.slug,
        productName: presentation.name,
        imageUrl: presentation.imageUrl,
        brandId: presentation.brand.slug,
        brandName: presentation.brand.name,
        categorySlug: result.categorySlug,
        priceCents: presentation.price?.cents ?? null,
        finalScore: result.finalScore,
        overallScore: overallByProduct.get(result.supplementId) ?? result.finalScore,
        classificationTier: result.classificationTier,
      });
    }
  }
  return enriched;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCatalog: {
  readonly value: Promise<EnrichedProduct[]>;
  readonly expiresAt: number;
} | null = null;

/**
 * Memoização simples em processo (TTL de 5 minutos) por cima da
 * consulta agregada real (`groupBy` + duas buscas em lote) — o
 * Panorama do Mercado nunca precisa refletir uma reavaliação no
 * segundo exato em que ela acontece, e isso evita recalcular tudo a
 * cada requisição de `/mercado`, `/creatina` e `/api/market`. Cache em
 * memória (não `unstable_cache`) porque o processo do servidor Next já
 * vive o tempo suficiente para isso valer a pena, sem acoplar a
 * infraestrutura de cache incremental do Next a uma consulta que não
 * depende de nenhuma rota específica.
 */
function loadEnrichedCatalogCached(): Promise<EnrichedProduct[]> {
  const now = Date.now();
  if (!cachedCatalog || cachedCatalog.expiresAt < now) {
    cachedCatalog = { value: loadEnrichedCatalog(), expiresAt: now + CACHE_TTL_MS };
  }
  return cachedCatalog.value;
}

export interface MarketOverview {
  readonly generatedAt: string;
  readonly statistics: MarketStatistics;
  readonly brandRanking: readonly BrandRankingEntry[];
  readonly insights: readonly string[];
}

export interface CategoryMarketView {
  readonly categorySlug: string;
  readonly statistics: CategoryStatistics;
  readonly insights: readonly string[];
}

export async function getMarketOverview(): Promise<MarketOverview | null> {
  const catalog = await loadEnrichedCatalogCached();
  if (catalog.length === 0) return null;

  const statistics = calculateMarketStatistics(catalog);
  const brandRanking = rankBrands(
    catalog.map((p) => ({
      productId: p.productId,
      productSlug: p.productSlug,
      productName: p.productName,
      brandId: p.brandId,
      brandName: p.brandName,
      priceCents: p.priceCents,
      finalScore: p.finalScore,
    })),
  );

  const marketAsCategory = calculateCategoryStatistics(
    catalog.map((p) => ({ finalScore: p.finalScore, priceCents: p.priceCents })),
  );
  const topOverallScorePrices = [...catalog]
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3)
    .map((p) => p.priceCents);

  const insights = generateMarketInsights({
    classificationTiers: catalog.map((p) => p.classificationTier),
    brandRanking,
    topOverallScorePrices,
    priceDistribution: marketAsCategory?.priceDistribution ?? [],
    formatPriceCents: formatCurrencyBRL,
  });

  return { generatedAt: new Date().toISOString(), statistics, brandRanking, insights };
}

export async function getCategoryMarketView(
  categorySlug: string,
): Promise<CategoryMarketView | null> {
  const catalog = await loadEnrichedCatalogCached();
  const inCategory = catalog.filter((p) => p.categorySlug === categorySlug);
  if (inCategory.length === 0) return null;

  const statistics = calculateCategoryStatistics(
    inCategory.map((p) => ({ finalScore: p.finalScore, priceCents: p.priceCents })),
  );
  if (!statistics) return null;

  const rankingScoresInOrder = await loadRankingScoresInOrder(categorySlug);
  const topOverallScorePrices = [...inCategory]
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3)
    .map((p) => p.priceCents);

  const insights = generateMarketInsights({
    classificationTiers: inCategory.map((p) => p.classificationTier),
    rankingScoresInOrder,
    brandRanking: [],
    topOverallScorePrices,
    priceDistribution: statistics.priceDistribution,
    formatPriceCents: formatCurrencyBRL,
  });

  return { categorySlug, statistics, insights };
}

async function loadRankingScoresInOrder(
  categorySlug: string,
): Promise<readonly number[] | undefined> {
  try {
    const ranking = await rankingService.get({ categorySlug });
    return [...ranking.entries].sort((a, b) => a.position - b.position).map((e) => e.finalScore);
  } catch {
    return undefined;
  }
}

/**
 * Produtos avaliados de UMA marca, do catálogo real — base das páginas
 * `/marcas/[slug]`. `brandId` aqui é o slug da marca (ver
 * `loadEnrichedCatalog`), não um id opaco de banco.
 */
export async function getProductsByBrand(brandSlug: string): Promise<readonly EnrichedProduct[]> {
  const catalog = await loadEnrichedCatalogCached();
  return catalog
    .filter((p) => p.brandId === brandSlug)
    .sort((a, b) => b.overallScore - a.overallScore);
}

/** Produtos avaliados de UMA categoria — base das páginas `/categorias/[slug]`. */
export async function getProductsByCategory(
  categorySlug: string,
): Promise<readonly EnrichedProduct[]> {
  const catalog = await loadEnrichedCatalogCached();
  return catalog
    .filter((p) => p.categorySlug === categorySlug)
    .sort((a, b) => b.overallScore - a.overallScore);
}
