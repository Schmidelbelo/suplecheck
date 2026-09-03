import { prisma } from "@/lib/db/prisma";
import type { RecordPriceInput } from "../validators/price.schema";

/**
 * Módulo `pricing`. Histórico de preços por produto/loja.
 * `PriceEntry` agora se relaciona a `Sku` (não a `Product` diretamente)
 * — um Suplemento pode ter várias variações com preços distintos (ver
 * docs/domain-model/DOMAIN_MODEL.md §3.1/§3.2) — por isso a busca por
 * "histórico de um produto" atravessa todos os seus SKUs.
 *
 * Sem Port/UseCase de Application Layer própria (mesma decisão já
 * documentada em `ARCHITECTURE.md` §3 para Store/PriceEntry/
 * ProductImage): é leitura/escrita de composição de apresentação, sem
 * invariante de negócio para proteger além do próprio schema
 * (append-only, ver comentário em `prisma/schema.prisma`) — introduzir
 * um Port só para isto duplicaria a heavy machinery de Clean
 * Architecture sem ganho real.
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

  /**
   * Grava um novo snapshot de preço — sempre `create`, nunca
   * atualiza uma linha existente (ver comentário de append-only no
   * schema). É assim que o histórico de preços cresce ao longo do
   * tempo; sem isto, nada nunca populava uma segunda captura.
   */
  async recordPrice(skuId: string, input: RecordPriceInput) {
    return prisma.priceEntry.create({
      data: {
        skuId,
        storeId: input.storeId,
        priceCents: input.priceCents,
        currency: input.currency,
        url: input.url,
        availability: input.availability,
      },
    });
  },
};

export interface PriceStats {
  readonly currentCents: number;
  readonly previousCents: number | null;
  readonly minCents: number;
  readonly maxCents: number;
  readonly avgCents: number;
  readonly capturesCount: number;
  readonly isAllTimeLow: boolean;
  readonly changeDirection: "up" | "down" | "flat" | null;
  readonly changePercent: number | null;
  readonly percentVsAverage: number;
}

/**
 * Estatísticas puras sobre uma série de capturas (mais antiga → mais
 * recente). Com 1 única captura, `previousCents`/`changeDirection`
 * ficam `null` — o chamador decide como exibir esse caso (nunca
 * inventa uma tendência que não existe).
 */
export function computePriceStats(entries: readonly { priceCents: number }[]): PriceStats | null {
  if (entries.length === 0) return null;

  const prices = entries.map((e) => e.priceCents);
  const current = prices[prices.length - 1]!;
  const previous = prices.length > 1 ? prices[prices.length - 2]! : null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  const changeDirection: PriceStats["changeDirection"] =
    previous == null ? null : current === previous ? "flat" : current > previous ? "up" : "down";
  const changePercent = previous != null ? ((current - previous) / previous) * 100 : null;

  return {
    currentCents: current,
    previousCents: previous,
    minCents: min,
    maxCents: max,
    avgCents: Math.round(avg),
    capturesCount: prices.length,
    isAllTimeLow: current === min,
    changeDirection,
    changePercent,
    percentVsAverage: avg > 0 ? ((current - avg) / avg) * 100 : 0,
  };
}
