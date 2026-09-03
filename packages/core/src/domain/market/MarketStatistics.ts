export interface MarketProductInput {
  readonly productId: string;
  readonly brandId: string;
  readonly priceCents: number | null;
  /** Índice SupleCheck (0–100) da avaliação mais recente do produto. */
  readonly finalScore: number;
  /** Score Geral (0–100), combinação de qualidade + preço. */
  readonly overallScore: number;
}

export interface MarketStatistics {
  readonly productCount: number;
  readonly brandCount: number;
  readonly averagePriceCents: number | null;
  readonly minPriceCents: number | null;
  readonly maxPriceCents: number | null;
  readonly bestOverallScore: number | null;
  readonly worstOverallScore: number | null;
  readonly averageScore: number | null;
}

/**
 * Panorama agregado do catálogo — todo campo é derivado diretamente do
 * conjunto de produtos recebido, nunca de um valor fixo ou estimado.
 * Um mercado vazio (nenhum produto publicado com dados suficientes)
 * devolve `null` nos campos numéricos em vez de zero, que seria uma
 * afirmação falsa ("preço médio é R$0").
 */
export function calculateMarketStatistics(
  products: readonly MarketProductInput[],
): MarketStatistics {
  const prices = products.map((p) => p.priceCents).filter((v): v is number => v != null);
  const overallScores = products.map((p) => p.overallScore);
  const finalScores = products.map((p) => p.finalScore);
  const brandCount = new Set(products.map((p) => p.brandId)).size;

  return {
    productCount: products.length,
    brandCount,
    averagePriceCents: prices.length > 0 ? average(prices) : null,
    minPriceCents: prices.length > 0 ? Math.min(...prices) : null,
    maxPriceCents: prices.length > 0 ? Math.max(...prices) : null,
    bestOverallScore: overallScores.length > 0 ? Math.max(...overallScores) : null,
    worstOverallScore: overallScores.length > 0 ? Math.min(...overallScores) : null,
    averageScore: finalScores.length > 0 ? average(finalScores) : null,
  };
}

export function average(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** Desvio padrão populacional simples — o conjunto recebido é tratado como a população inteira, não uma amostra. */
export function standardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const avg = average(values);
  const variance = average(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}
