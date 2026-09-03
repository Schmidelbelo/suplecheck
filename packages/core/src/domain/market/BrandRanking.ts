import { average } from "./MarketStatistics";

export interface BrandRankingProductInput {
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly priceCents: number | null;
  readonly finalScore: number;
}

export interface BrandRankingProductRef {
  readonly productId: string;
  readonly slug: string;
  readonly name: string;
  readonly finalScore: number;
}

export interface BrandRankingEntry {
  readonly brandId: string;
  readonly brandName: string;
  readonly productCount: number;
  readonly averageScore: number;
  readonly averagePriceCents: number | null;
  readonly bestProduct: BrandRankingProductRef;
  readonly worstProduct: BrandRankingProductRef;
}

function toRef(p: BrandRankingProductInput): BrandRankingProductRef {
  return {
    productId: p.productId,
    slug: p.productSlug,
    name: p.productName,
    finalScore: p.finalScore,
  };
}

/**
 * Ranking de marcas — ordenado por nota média (Índice SupleCheck) das
 * avaliações mais recentes de cada produto, do catálogo real. Uma
 * marca com um único produto tem `bestProduct === worstProduct`, o que
 * é o resultado honesto (não há "melhor" e "pior" reais quando só
 * existe um).
 */
export function rankBrands(
  products: readonly BrandRankingProductInput[],
): readonly BrandRankingEntry[] {
  const byBrand = new Map<string, BrandRankingProductInput[]>();
  for (const product of products) {
    const list = byBrand.get(product.brandId) ?? [];
    list.push(product);
    byBrand.set(product.brandId, list);
  }

  const entries: BrandRankingEntry[] = [...byBrand.entries()].map(([brandId, brandProducts]) => {
    const sortedByScore = [...brandProducts].sort((a, b) => b.finalScore - a.finalScore);
    const prices = brandProducts.map((p) => p.priceCents).filter((v): v is number => v != null);
    return {
      brandId,
      brandName: brandProducts[0]!.brandName,
      productCount: brandProducts.length,
      averageScore: average(brandProducts.map((p) => p.finalScore)),
      averagePriceCents: prices.length > 0 ? average(prices) : null,
      bestProduct: toRef(sortedByScore[0]!),
      worstProduct: toRef(sortedByScore[sortedByScore.length - 1]!),
    };
  });

  return entries.sort((a, b) => b.averageScore - a.averageScore);
}
