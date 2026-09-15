import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { publishApprovedPendingImage } from "@/modules/media/services/productImage.service";

/**
 * Publica UM candidato já aprovado na Fase 1 pro Vercel Blob — baixa
 * de novo a `candidateUrl` (nunca reaproveita bytes da descoberta),
 * converte pra WEBP, atualiza `ProductImage` e tira o produto da fila.
 * Protegido por `ADMIN_API_KEY`.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { pendingImageId?: string } | null;
    if (!body?.pendingImageId) {
      return NextResponse.json(
        { code: "INVALID_BODY", message: "pendingImageId é obrigatório." },
        { status: 422 },
      );
    }

    const result = await publishApprovedPendingImage(body.pendingImageId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/admin/images/publish] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
