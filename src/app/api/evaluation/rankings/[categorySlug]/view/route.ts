import { NextResponse } from "next/server";
import { rankingService } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";
import { productViewService } from "@/modules/evaluation/services/productView.service";

type Params = { params: Promise<{ categorySlug: string }> };

/**
 * Leitura combinada para a página pública `/creatina`: ranking (Application)
 * + apresentação de cada produto (marca, SKU, preço, preço por dose,
 * loja, imagem). É o único endpoint que essa página consome — nunca
 * dados mockados (ver ARCHITECTURE.md §3).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { categorySlug } = await params;
    const ranking = await rankingService.get({ categorySlug });
    const presentations = await productViewService.loadPresentations(
      ranking.entries.map((entry) => entry.supplementId),
    );

    return NextResponse.json({
      categorySlug: ranking.categorySlug,
      methodologyId: ranking.methodologyId,
      methodologyVersion: ranking.methodologyVersion,
      generatedAt: ranking.generatedAt,
      entries: ranking.entries
        .map((entry) => {
          const product = presentations.get(entry.supplementId);
          if (!product) return null;
          return {
            position: entry.position,
            finalScore: entry.finalScore,
            classificationTier: entry.classificationTier,
            product,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
