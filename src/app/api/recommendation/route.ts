import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handleApiError";
import {
  getRecommendation,
  resolveCategoryForGoal,
} from "@/modules/recommendation/services/recommendationData.service";
import { decodeProfileFromSearchParams } from "@/modules/recommendation/lib/profileQuery";

/**
 * Recomendação Personalizada — recebe o perfil (via querystring, mesmos
 * parâmetros da URL compartilhável de `/assistente`) e devolve o
 * ranking personalizado, a justificativa (vantagens/desvantagens reais
 * de cada produto) e os pesos usados no cálculo. Score Geral e Índice
 * SupleCheck nunca são alterados — o Score Personalizado é recalculado
 * a cada chamada, nunca persistido (ver docs/SCORING.md).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profile = decodeProfileFromSearchParams(searchParams);
    const categorySlug = resolveCategoryForGoal(profile.goal);

    if (!categorySlug) {
      return NextResponse.json(
        {
          code: "GOAL_WITHOUT_DATA",
          message: "Ainda não há produtos avaliados para este objetivo.",
        },
        { status: 404 },
      );
    }

    const result = await getRecommendation({
      categorySlug,
      priority: profile.priority,
      maxBudgetCents: profile.budgetCents,
    });

    if (!result) {
      return NextResponse.json(
        {
          code: "CATEGORY_WITHOUT_DATA",
          message: "Nenhum produto avaliado nesta categoria ainda.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      categorySlug,
      weightsUsed: result.weightsUsed,
      ranking: result.ranking,
      recommended: result.recommended,
      runnerUp: result.runnerUp,
      cheapest: result.cheapest,
      comparisonNarrative: result.comparisonNarrative,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
