import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handleApiError";
import { loadProductDetailView } from "@/modules/evaluation/services/productDetailView.service";

type Params = { params: Promise<{ idOrSlug: string }> };

/**
 * Leitura combinada para consumidores externos da API pública. As
 * páginas do próprio app (`/creatina/[slug]`, `/categorias/[slug]/[produto]`)
 * NÃO chamam esta rota mais — usam `loadProductDetailView` diretamente
 * (ver `productDetailView.service.ts`), sem round-trip HTTP para o
 * próprio deploy. Esta rota continua existindo só para quem consome a
 * API de fora do Next (scripts, integrações futuras).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const view = await loadProductDetailView(idOrSlug);
    if (!view) {
      return NextResponse.json(
        { code: "PRODUCT_NOT_FOUND", message: "Produto não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json(view);
  } catch (error) {
    return handleApiError(error);
  }
}
