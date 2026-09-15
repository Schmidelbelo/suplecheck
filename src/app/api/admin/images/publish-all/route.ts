import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";
import { publishApprovedPendingImage } from "@/modules/media/services/productImage.service";

/**
 * Publica TODOS os candidatos com `status = APPROVED` de uma vez —
 * mesmo caminho de `publishApprovedPendingImage` por item, sequencial
 * (nunca em paralelo: cada upload já bate no Blob, evita saturar).
 * Protegido por `ADMIN_API_KEY`.
 */
export async function POST() {
  try {
    const approved = await prisma.pendingImage.findMany({
      where: { status: "APPROVED" },
      select: { id: true },
    });

    let published = 0;
    let skipped = 0;
    const failures: { pendingImageId: string; reason: string }[] = [];

    for (const row of approved) {
      const result = await publishApprovedPendingImage(row.id);
      if (result.status === "published") published++;
      else {
        skipped++;
        failures.push({ pendingImageId: row.id, reason: result.reason });
      }
    }

    return NextResponse.json({ total: approved.length, published, skipped, failures });
  } catch (error) {
    console.error("[api/admin/images/publish-all] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
