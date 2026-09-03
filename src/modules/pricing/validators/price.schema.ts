import { z } from "zod";

export const recordPriceSchema = z.object({
  storeId: z.string().min(1),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).default("BRL"),
  url: z.string().url().optional(),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK", "UNKNOWN"]).default("UNKNOWN"),
});

export type RecordPriceInput = z.infer<typeof recordPriceSchema>;
