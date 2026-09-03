import { container } from "@/lib/container";
import { productViewService } from "@/modules/evaluation/services/productView.service";
import {
  calculateOverallScores,
  buildRecommendation,
  type RecommendationCandidate,
  type RecommendationPriority,
  type RecommendationResult,
} from "@core/index";

/**
 * Único objetivo hoje mapeado para uma categoria com avaliação real —
 * "objetivo principal" só oferece, na UI, motivos reais para tomar
 * creatina (não existe outra categoria com Índice SupleCheck calculado
 * ainda). Nunca inventamos uma recomendação para uma categoria sem
 * dado — ver `resolveCategoryForGoal`.
 */
const GOAL_TO_CATEGORY: Record<string, string> = {
  "ganho-de-massa": "creatina",
  performance: "creatina",
  recuperacao: "creatina",
};

export function resolveCategoryForGoal(goal: string | null): string | null {
  if (!goal) return "creatina";
  return GOAL_TO_CATEGORY[goal] ?? null;
}

export interface RecommendationRequest {
  readonly categorySlug: string;
  readonly priority: RecommendationPriority;
  readonly maxBudgetCents: number | null;
}

/**
 * Carrega os candidatos reais de uma categoria (mesma fonte de dados
 * de `/api/evaluation/rankings/[categorySlug]/view`: últimas avaliações
 * + apresentação em lote) e delega toda a lógica de ranqueamento ao
 * Core Domain (`buildRecommendation`) — esta função só busca e
 * traduz dados, nunca decide nada sobre pontuação.
 */
export async function getRecommendation(
  request: RecommendationRequest,
): Promise<RecommendationResult | null> {
  const indexResults = await container.ports.indexResults.listLatestByCategory(
    request.categorySlug,
  );
  if (indexResults.length === 0) return null;

  const presentations = await productViewService.loadPresentations(
    indexResults.map((r) => r.supplementId),
  );

  const withPresentation = indexResults
    .map((result) => ({ result, presentation: presentations.get(result.supplementId) }))
    .filter(
      (
        v,
      ): v is {
        result: (typeof indexResults)[number];
        presentation: NonNullable<typeof v.presentation>;
      } => v.presentation !== undefined,
    );
  if (withPresentation.length === 0) return null;

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

  const candidates: RecommendationCandidate[] = withPresentation.map(
    ({ result, presentation }) => ({
      productId: result.supplementId,
      productName: presentation.name,
      productSlug: presentation.slug,
      brandName: presentation.brand.name,
      classificationTier: result.classificationTier,
      priceCents: presentation.price?.cents ?? null,
      qualityScore: result.finalScore,
      overallScore: overallByProduct.get(result.supplementId) ?? result.finalScore,
      pricePerDoseCents: presentation.price?.pricePerDoseCents ?? null,
      pricePerGramCents: presentation.price?.pricePerGramCents ?? null,
      transparencyScore:
        result.breakdown.find((b) => b.criterionId === "label-transparency")?.score ?? null,
      criteriaBreakdown: result.breakdown.map((b) => ({
        criterionId: b.criterionId,
        score: b.score,
        weight: b.weight,
      })),
    }),
  );

  return buildRecommendation(candidates, {
    priority: request.priority,
    maxBudgetCents: request.maxBudgetCents,
  });
}
