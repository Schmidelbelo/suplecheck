import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runImageGuardrail } from "@/modules/media/services/productImage.service";

/**
 * Fila/staging da Central de Imagens (`/admin/imagens`) — TODOS os
 * status (`PENDING`, `APPROVED`, `REJECTED`), com o candidato completo
 * da Fase 1 (candidateUrl, confidence, sourceUrl, source, width,
 * height) pra decidir publicar em lote ou revisar caso a caso. Roda o
 * guardrail antes de responder — nunca deixa um produto `PUBLISHED`
 * sem capa real E sem estar na fila (idempotente). Protegido por
 * `ADMIN_API_KEY` via `src/middleware.ts`.
 */
export async function GET() {
  const guardrail = await runImageGuardrail();

  const rows = await prisma.pendingImage.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      productId: true,
      productName: true,
      brandName: true,
      categoryName: true,
      status: true,
      sourceUrl: true,
      candidateUrl: true,
      confidence: true,
      width: true,
      height: true,
      source: true,
      reason: true,
      createdAt: true,
      product: { select: { slug: true } },
    },
  });

  return NextResponse.json({
    guardrail,
    items: rows.map((p) => ({
      id: p.id,
      productId: p.productId,
      slug: p.product.slug,
      productName: p.productName,
      brandName: p.brandName,
      categoryName: p.categoryName,
      status: p.status,
      sourceUrl: p.sourceUrl,
      candidateUrl: p.candidateUrl,
      confidence: p.confidence,
      width: p.width,
      height: p.height,
      source: p.source,
      reason: p.reason,
      createdAt: p.createdAt,
    })),
  });
}
