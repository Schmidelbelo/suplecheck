import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";

/** Lista as execuções mais recentes de qualquer job de importação/captura — protegido em `src/middleware.ts` (todo `/api/admin/*`). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") ?? undefined;
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));

    const batches = await prisma.importBatch.findMany({
      where: source ? { source } : undefined,
      orderBy: { startedAt: "desc" },
      take: limit,
      select: {
        id: true,
        source: true,
        status: true,
        totalRecords: true,
        importedRecords: true,
        failedRecords: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error("[api/admin/jobs] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
