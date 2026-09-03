import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import { priceService } from "@/modules/pricing/services/price.service";
import { recordPriceSchema } from "@/modules/pricing/validators/price.schema";

type Params = { params: Promise<{ id: string }> };

/** Público — histórico de preços é informação de exibição, não administrativa. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const history = await priceService.getHistoryBySku(id);
    return NextResponse.json(history);
  } catch (error) {
    console.error("[api/catalog/skus/prices] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}

/**
 * Grava um novo snapshot de preço — protegido por `ADMIN_API_KEY` (ver
 * `src/middleware.ts`, prefixo `/api/catalog` já coberto). É o único
 * jeito de o histórico de preços crescer ao longo do tempo; antes desta
 * rota não existia nenhum caminho de escrita.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = recordPriceSchema.parse(body);
    const entry = await priceService.recordPrice(id, input);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos", issues: error.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[api/catalog/skus/prices] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
