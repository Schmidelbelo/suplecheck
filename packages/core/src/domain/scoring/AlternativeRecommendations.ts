export interface AlternativeCandidate {
  readonly productId: string;
  readonly priceCents: number | null;
  readonly finalScore: number;
  readonly overallScore: number;
}

export interface RecommendationSet {
  /** `productId` do candidato mais barato — só quando estritamente mais barato que o produto atual. */
  readonly cheapest: string | null;
  /** `productId` do candidato com maior Índice SupleCheck — só quando estritamente maior que o atual. */
  readonly topRated: string | null;
  /** `productId` do candidato com maior Score Geral — só quando estritamente maior que o atual. */
  readonly bestBalance: string | null;
}

/**
 * "Se eu fosse economizar...", "Se eu quisesse a maior nota...",
 * "Melhor equilíbrio entre nota e preço" — os 3 slots são a mesma regra
 * aplicada a 3 métricas diferentes (preço, nota, Score Geral), nunca 3
 * lógicas separadas. Um slot só recomenda um produto quando ele é
 * estritamente melhor que o atual naquela métrica — nunca sugere uma
 * "alternativa" pior ou igual (isso não seria uma alternativa de
 * verdade).
 */
export function recommendAlternatives(
  current: AlternativeCandidate,
  others: readonly AlternativeCandidate[],
): RecommendationSet {
  const cheaperOnes = others.filter(
    (o) => o.priceCents != null && current.priceCents != null && o.priceCents < current.priceCents,
  );
  const cheapest = [...cheaperOnes].sort((a, b) => a.priceCents! - b.priceCents!)[0] ?? null;

  const higherRated = others.filter((o) => o.finalScore > current.finalScore);
  const topRated = [...higherRated].sort((a, b) => b.finalScore - a.finalScore)[0] ?? null;

  const betterBalanced = others.filter((o) => o.overallScore > current.overallScore);
  const bestBalance =
    [...betterBalanced].sort((a, b) => b.overallScore - a.overallScore)[0] ?? null;

  return {
    cheapest: cheapest?.productId ?? null,
    topRated: topRated?.productId ?? null,
    bestBalance: bestBalance?.productId ?? null,
  };
}
