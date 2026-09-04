export interface ProductBadgeInput {
  readonly productId: string;
  readonly priceCents: number | null;
  /** Índice SupleScore (0–100) já calculado pela metodologia vigente. */
  readonly finalScore: number;
  /** Score Geral já calculado por `calculateOverallScores` — nunca recalculado aqui. */
  readonly overallScore: number;
  /** `criterionId` → nota (0–100) do breakdown já persistido — nunca recalculado aqui. */
  readonly criteriaScores: Readonly<Record<string, number>>;
}

export interface ProductBadge {
  readonly emoji: string;
  readonly label: string;
}

interface BadgeRule {
  readonly emoji: string;
  readonly label: string;
  /** Valor comparável desta regra para este produto — `null` quando o produto não tem o dado. */
  readonly valueOf: (input: ProductBadgeInput) => number | null;
  readonly lowerIsBetter?: boolean;
}

/**
 * Cada selo usa só um fator real, nunca uma combinação inventada —
 * "Melhor Avaliado" é literalmente a nota do critério `reputation`,
 * "Melhor Custo-Benefício" é a nota do critério `cost-benefit`, ambos
 * já calculados pela metodologia (nunca recomputados aqui).
 */
const BADGE_RULES: readonly BadgeRule[] = [
  {
    emoji: "🏆",
    label: "Melhor Compra",
    valueOf: (i) => i.overallScore,
  },
  {
    emoji: "⭐",
    label: "Melhor Avaliado",
    valueOf: (i) => i.criteriaScores["reputation"] ?? null,
  },
  {
    emoji: "💰",
    label: "Melhor Preço",
    valueOf: (i) => i.priceCents,
    lowerIsBetter: true,
  },
  {
    emoji: "📊",
    label: "Maior Nota Geral",
    valueOf: (i) => i.finalScore,
  },
  {
    emoji: "🔥",
    label: "Melhor Custo-Benefício",
    valueOf: (i) => i.criteriaScores["cost-benefit"] ?? null,
  },
];

/**
 * Atribui os selos de um conjunto comparável (mesma categoria/ranking).
 * Um selo só é atribuído quando há um vencedor único e sem empate — se
 * dois ou mais produtos empatam no valor exato, ninguém recebe o selo
 * (nunca escolhe arbitrariamente entre empatados, nunca duplica o
 * selo). Retorna um Map de `productId` → lista de selos (0 a N por
 * produto, um mesmo produto pode vencer em mais de um fator).
 */
export function assignProductBadges(
  inputs: readonly ProductBadgeInput[],
): Map<string, ProductBadge[]> {
  const result = new Map<string, ProductBadge[]>(inputs.map((i) => [i.productId, []]));

  for (const rule of BADGE_RULES) {
    const withValues = inputs
      .map((i) => ({ productId: i.productId, value: rule.valueOf(i) }))
      .filter((v): v is { productId: string; value: number } => v.value != null);

    if (withValues.length === 0) continue;

    const best = rule.lowerIsBetter
      ? Math.min(...withValues.map((v) => v.value))
      : Math.max(...withValues.map((v) => v.value));

    const winners = withValues.filter((v) => v.value === best);
    if (winners.length !== 1) continue; // empate — ninguém recebe o selo

    result.get(winners[0]!.productId)!.push({ emoji: rule.emoji, label: rule.label });
  }

  return result;
}
