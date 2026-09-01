import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

/** Histórico completo de avaliações de um produto, mais recente primeiro. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    const history = await container.useCases.listSupplementScoreHistory.execute(product.id);
    return NextResponse.json({ items: history });
  } catch (error) {
    return handleApiError(error);
  }
}
