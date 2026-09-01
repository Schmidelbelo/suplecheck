import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

/**
 * Recalcular o Índice de um produto já avaliado antes — exige fatos
 * atualizados no corpo (preço mudou, rótulo mudou etc.); a nota anterior
 * nunca é sobrescrita, uma nova entra no histórico (`RecalculateSupplementScoreUseCase`).
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    const body = await request.json();
    const score = await container.useCases.recalculateSupplementScore.execute({
      supplementId: product.id,
      methodologyId: body.methodologyId,
      facts: body.facts,
    });
    return NextResponse.json(score);
  } catch (error) {
    return handleApiError(error);
  }
}
