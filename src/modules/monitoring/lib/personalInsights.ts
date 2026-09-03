import { formatCurrencyBRL } from "@/lib/utils/format";

export interface ViewedProductSummary {
  readonly slug: string;
  readonly productName: string;
  readonly brandName: string;
  readonly visitCount: number;
}

export interface ComparisonPriceSpread {
  /** Diferença (em centavos) entre o produto mais caro e o mais barato de UMA comparação aberta pelo usuário. */
  readonly spreadCents: number;
}

export interface PersonalInsightsInput {
  readonly viewedProducts: readonly ViewedProductSummary[];
  readonly favoritesCount: number;
  /** Orçamentos (em centavos) informados nas últimas vezes que o usuário usou o Assistente de Escolha. */
  readonly recommendationBudgetsCents: readonly number[];
  readonly comparisonSpreads: readonly ComparisonPriceSpread[];
}

function mostFrequentBrand(viewedProducts: readonly ViewedProductSummary[]): string | null {
  const distinctProductsByBrand = new Map<string, Set<string>>();
  for (const product of viewedProducts) {
    const set = distinctProductsByBrand.get(product.brandName) ?? new Set<string>();
    set.add(product.slug);
    distinctProductsByBrand.set(product.brandName, set);
  }
  const ranked = [...distinctProductsByBrand.entries()]
    .map(([brand, slugs]) => ({ brand, count: slugs.size }))
    .sort((a, b) => b.count - a.count);

  // Só vira insight quando há uma marca claramente à frente (≥2 produtos
  // distintos visitados dessa marca, e mais que qualquer outra) — nunca
  // aponta uma "marca preferida" de uma única visita.
  if (ranked.length === 0 || ranked[0]!.count < 2) return null;
  if (ranked.length > 1 && ranked[1]!.count === ranked[0]!.count) return null;
  return ranked[0]!.brand;
}

/**
 * Frases de "Insights pessoais" — cada uma só aparece quando o dado
 * real por trás dela existe e é conclusivo; nenhuma é gerada a partir
 * de menos de um mínimo de dado real (ver comentários por regra).
 * Tudo vem de `localStorage` (histórico de visitas, favoritos,
 * recomendações, comparações) já resolvido contra o catálogo real pelo
 * chamador — esta função não faz nenhuma suposição sobre dado ausente.
 */
export function generatePersonalInsights(input: PersonalInsightsInput): readonly string[] {
  const sentences: string[] = [];

  const topBrand = mostFrequentBrand(input.viewedProducts);
  if (topBrand) {
    sentences.push(`Você costuma pesquisar produtos da marca ${topBrand}.`);
  }

  if (input.recommendationBudgetsCents.length > 0) {
    const average =
      input.recommendationBudgetsCents.reduce((sum, v) => sum + v, 0) /
      input.recommendationBudgetsCents.length;
    sentences.push(`Seu orçamento médio informado ao Assistente é ${formatCurrencyBRL(average)}.`);
  }

  const mostViewed = [...input.viewedProducts].sort((a, b) => b.visitCount - a.visitCount)[0];
  if (mostViewed && mostViewed.visitCount >= 2) {
    sentences.push(`Você visualizou ${mostViewed.productName} ${mostViewed.visitCount} vezes.`);
  }

  if (input.comparisonSpreads.length > 0) {
    const averageSpread =
      input.comparisonSpreads.reduce((sum, c) => sum + c.spreadCents, 0) /
      input.comparisonSpreads.length;
    if (averageSpread > 0) {
      sentences.push(
        `Nas comparações que você abriu, a diferença entre o produto mais caro e o mais barato foi, em média, de ${formatCurrencyBRL(averageSpread)}.`,
      );
    }
  }

  if (input.favoritesCount > 0) {
    sentences.push(
      `Você tem ${input.favoritesCount} produto${input.favoritesCount === 1 ? "" : "s"} favoritado${input.favoritesCount === 1 ? "" : "s"}.`,
    );
  }

  return sentences;
}
