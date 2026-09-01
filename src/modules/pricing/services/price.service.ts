import { prisma } from "@/lib/db/prisma";

/**
 * Módulo `pricing` (Fase 3). Histórico de preços por produto/loja.
 * `PriceEntry` agora se relaciona a `Sku` (não a `Product` diretamente)
 * — um Suplemento pode ter várias variações com preços distintos (ver
 * docs/domain-model/DOMAIN_MODEL.md §3.1/§3.2) — por isso a busca por
 * "histórico de um produto" atravessa todos os seus SKUs.
 */
export const priceService = {
  async getHistoryByProduct(productId: string) {
    return prisma.priceEntry.findMany({
      where: { sku: { productId } },
      include: { store: true, sku: true },
      orderBy: { capturedAt: "asc" },
    });
  },

  async getHistoryBySku(skuId: string) {
    return prisma.priceEntry.findMany({
      where: { skuId },
      include: { store: true },
      orderBy: { capturedAt: "asc" },
    });
  },
};
