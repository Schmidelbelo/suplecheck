import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Fila da Central de Imagens (`/admin/imagens`) — produtos publicados
 * sem imagem oficial local. Protegido por `ADMIN_API_KEY` via
 * `src/middleware.ts` (`/api/admin` é totalmente protegido).
 */
export async function GET() {
  const pending = await prisma.pendingImage.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      productId: true,
      productName: true,
      brandName: true,
      categoryName: true,
      reason: true,
      createdAt: true,
      product: { select: { slug: true } },
    },
  });

  return NextResponse.json(
    pending.map((p) => ({
      id: p.id,
      productId: p.productId,
      slug: p.product.slug,
      productName: p.productName,
      brandName: p.brandName,
      categoryName: p.categoryName,
      reason: p.reason,
      createdAt: p.createdAt,
    })),
  );
}
