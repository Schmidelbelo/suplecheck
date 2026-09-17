import { z } from "zod";

export const recordPriceSchema = z.object({
  storeId: z.string().min(1),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).default("BRL"),
  url: z.string().url().optional(),
  /**
   * Link de afiliado já pronto para ESTA captura específica — só
   * quando o programa exige geração manual por produto (ex.: deeplink
   * Mercado Livre), em vez de um template aplicável a qualquer URL da
   * loja (`Store.affiliateBaseUrl`). Opcional; a grande maioria das
   * capturas nunca preenche este campo. Ainda não consumido em nenhum
   * caminho de runtime (ver docs/DESENHO_AFILIADO_POR_OFERTA.md).
   */
  affiliateUrl: z.string().url().optional(),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK", "UNKNOWN"]).default("UNKNOWN"),
});

export type RecordPriceInput = z.infer<typeof recordPriceSchema>;
