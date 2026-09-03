export interface ComparisonCandidate {
  readonly productId: string;
  readonly name: string;
  readonly priceCents: number | null;
  readonly finalScore: number;
  readonly overallScore: number;
}

/**
 * Resumo em linguagem natural da comparação — 3 frases no máximo,
 * cada uma só aparece quando o dado que a sustenta existe e a
 * diferença é real (nunca "0% mais barato" ou "0 pontos maior"). Nada
 * de geração de texto livre/IA externa: são templates preenchidos com
 * números calculados a partir do Score Geral e do Índice SupleCheck já
 * existentes — a mesma fonte usada em toda a plataforma.
 */
export function buildComparisonNarrative(
  entries: readonly ComparisonCandidate[],
): readonly string[] {
  if (entries.length < 2) return [];

  const sentences: string[] = [];

  const withPrice = entries.filter((e) => e.priceCents != null);
  if (withPrice.length >= 2) {
    const cheapest = [...withPrice].sort((a, b) => a.priceCents! - b.priceCents!)[0]!;
    const priciest = [...withPrice].sort((a, b) => b.priceCents! - a.priceCents!)[0]!;
    if (cheapest.productId !== priciest.productId) {
      const diffPercent = Math.round(
        ((priciest.priceCents! - cheapest.priceCents!) / priciest.priceCents!) * 100,
      );
      if (diffPercent > 0) {
        sentences.push(`${cheapest.name} custa ${diffPercent}% menos que ${priciest.name}.`);
      }
    }
  }

  const bestRated = [...entries].sort((a, b) => b.finalScore - a.finalScore)[0]!;
  const worstRated = [...entries].sort((a, b) => a.finalScore - b.finalScore)[0]!;
  if (bestRated.productId !== worstRated.productId) {
    const diff = Math.round((bestRated.finalScore - worstRated.finalScore) * 10) / 10;
    if (diff > 0) {
      sentences.push(
        `${bestRated.name} tem nota ${diff.toFixed(1)} ponto${diff >= 2 ? "s" : ""} maior no Índice SupleCheck que ${worstRated.name}.`,
      );
    }
  }

  const bestOverall = [...entries].sort((a, b) => b.overallScore - a.overallScore)[0]!;
  const secondBestOverall = [...entries].sort((a, b) => b.overallScore - a.overallScore)[1];
  if (secondBestOverall && bestOverall.overallScore > secondBestOverall.overallScore) {
    sentences.push(`Pelo Score Geral, recomendamos ${bestOverall.name}.`);
  }

  return sentences;
}
