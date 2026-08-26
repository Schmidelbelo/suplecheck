import type { PriceEntry, Store } from "@prisma/client";

export type { PriceEntry, Store };

export interface PriceHistoryPoint {
  priceCents: number;
  capturedAt: Date;
  storeName: string;
}
