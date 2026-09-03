import { buildComparisonNarrative } from "@core/index";
import { criterionLabel } from "@/modules/evaluation/lib/criteria";
import type { RankingViewEntry } from "@/modules/evaluation/types";

export interface CriterionDiffRow {
  readonly criterionId: string;
  readonly label: string;
  readonly scoreA: number | null;
  readonly scoreB: number | null;
  readonly winner: "a" | "b" | "tie" | null;
}

export interface ComparisonPageData {
  readonly productA: RankingViewEntry;
  readonly productB: RankingViewEntry;
  readonly narrative: readonly string[];
  readonly criteriaDiff: readonly CriterionDiffRow[];
  /** Rótulos dos critérios em que cada produto tem nota estritamente maior. */
  readonly advantagesA: readonly string[];
  readonly advantagesB: readonly string[];
  /** Vencedor pelo Score Geral — `"tie"` num empate exato, nunca decidido arbitrariamente. */
  readonly winner: "a" | "b" | "tie";
}

/**
 * Monta todo o conteúdo de uma página de comparação a partir de dois
 * `RankingViewEntry` reais — reaproveita `buildComparisonNarrative`
 * (mesma função usada na comparação manual do ranking) para a
 * conclusão em linguagem natural, nunca uma segunda heurística
 * reescrita aqui.
 */
export function buildComparisonPageData(
  productA: RankingViewEntry,
  productB: RankingViewEntry,
): ComparisonPageData {
  const narrative = buildComparisonNarrative([
    {
      productId: productA.product.id,
      name: productA.product.name,
      priceCents: productA.product.price?.cents ?? null,
      finalScore: productA.finalScore,
      overallScore: productA.overallScore,
    },
    {
      productId: productB.product.id,
      name: productB.product.name,
      priceCents: productB.product.price?.cents ?? null,
      finalScore: productB.finalScore,
      overallScore: productB.overallScore,
    },
  ]);

  const criterionIds = new Set([
    ...Object.keys(productA.criteriaScores),
    ...Object.keys(productB.criteriaScores),
  ]);

  const criteriaDiff: CriterionDiffRow[] = [...criterionIds].map((criterionId) => {
    const scoreA = productA.criteriaScores[criterionId] ?? null;
    const scoreB = productB.criteriaScores[criterionId] ?? null;
    const winner =
      scoreA == null || scoreB == null
        ? null
        : scoreA === scoreB
          ? "tie"
          : scoreA > scoreB
            ? "a"
            : "b";
    return { criterionId, label: criterionLabel(criterionId), scoreA, scoreB, winner };
  });

  const advantagesA = criteriaDiff.filter((c) => c.winner === "a").map((c) => c.label);
  const advantagesB = criteriaDiff.filter((c) => c.winner === "b").map((c) => c.label);

  const winner: ComparisonPageData["winner"] =
    productA.overallScore === productB.overallScore
      ? "tie"
      : productA.overallScore > productB.overallScore
        ? "a"
        : "b";

  return { productA, productB, narrative, criteriaDiff, advantagesA, advantagesB, winner };
}
