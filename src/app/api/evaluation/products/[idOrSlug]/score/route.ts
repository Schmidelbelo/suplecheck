import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

/** Consultar o Índice SupleScore mais recente de um produto. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    const score = await container.useCases.getSupplementScore.execute(product.id);
    return NextResponse.json(score);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Calcular o Índice SupleScore de um produto pela primeira vez (ou avaliar de novo com fatos atualizados). */
export async function POST(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    const body = await request.json();
    const score = await container.useCases.evaluateSupplement.execute({
      supplementId: product.id,
      methodologyId: body.methodologyId,
      facts: body.facts,
    });
    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
