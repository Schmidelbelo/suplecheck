import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

/** Detalhe de uma execução — inclui os erros registrados (`ImportRecordError`). Protegido em `src/middleware.ts`. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const batch = await prisma.importBatch.findUnique({
      where: { id },
      include: {
        errors: { orderBy: { createdAt: "desc" }, take: 100 },
        priceEntries: {
          orderBy: { capturedAt: "desc" },
          take: 100,
          include: { sku: { include: { product: { select: { name: true } } } } },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Job não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("[api/admin/jobs/:id] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
