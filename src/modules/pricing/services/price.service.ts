import { prisma } from "@/lib/db/prisma";

/** Módulo `pricing` (Fase 3). Histórico de preços por produto/loja. */
export const priceService = {
  async getHistory(productId: string) {
    return prisma.priceEntry.findMany({
      where: { productId },
      include: { store: true },
      orderBy: { capturedAt: "asc" },
    });
  },
};
