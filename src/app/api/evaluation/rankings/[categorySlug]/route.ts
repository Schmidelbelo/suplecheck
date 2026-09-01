import { NextResponse } from "next/server";
import { container, rankingService } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ categorySlug: string }> };

/** Lê o último snapshot de ranking já gerado para a categoria — nunca recalcula (Domain Model §3.4). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { categorySlug } = await params;
    const ranking = await rankingService.get({ categorySlug });
    return NextResponse.json(ranking);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Gera um novo snapshot de ranking a partir das notas mais recentes de cada produto da categoria. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { categorySlug } = await params;
    const ranking = await container.useCases.generateRanking.execute({ categorySlug });
    return NextResponse.json(ranking, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
