import type { PriceScraperResult } from "./PriceScraperPort";

/**
 * Cada etapa do pipeline (Validação → Normalização → Comparação) é uma
 * função pura e testável isoladamente, sem I/O — só `PersistPriceStep`
 * (em `PriceCaptureJobRunner.ts`) toca o banco. É o que "separado por
 * Use Cases" significa aqui: cada responsabilidade isolada, encadeável,
 * testável sem mock de Prisma.
 */

export class InvalidPriceCaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPriceCaptureError";
  }
}

const MAX_PLAUSIBLE_SWING_RATIO = 5; // preço não pode ter multiplicado/dividido por mais que isto de uma captura para outra

/**
 * Validação — rejeita preços absurdos (zero, negativo, ou uma variação
 * tão grande que é mais provável ser erro de captura do que uma
 * promoção real). Protege o histórico de ficar poluído por lixo.
 */
export function validateCapturedPrice(
  result: PriceScraperResult,
  lastKnownPriceCents: number | null,
): void {
  if (!Number.isFinite(result.priceCents) || result.priceCents <= 0) {
    throw new InvalidPriceCaptureError(`Preço capturado inválido: ${result.priceCents}`);
  }

  if (lastKnownPriceCents != null && lastKnownPriceCents > 0) {
    const ratio = result.priceCents / lastKnownPriceCents;
    if (ratio > MAX_PLAUSIBLE_SWING_RATIO || ratio < 1 / MAX_PLAUSIBLE_SWING_RATIO) {
      throw new InvalidPriceCaptureError(
        `Variação implausível: de ${lastKnownPriceCents} para ${result.priceCents} centavos (${(ratio * 100).toFixed(0)}%). Provável erro de captura, não uma promoção real.`,
      );
    }
  }
}

export interface NormalizedPrice {
  readonly priceCents: number;
  readonly availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
}

/** Normalização — arredonda para inteiro (centavos são a unidade de armazenamento do schema). */
export function normalizeCapturedPrice(result: PriceScraperResult): NormalizedPrice {
  return {
    priceCents: Math.round(result.priceCents),
    availability: result.availability,
  };
}

export type PriceComparison = "increased" | "decreased" | "unchanged" | "first_capture";

/** Comparação — contra o último preço conhecido do mesmo SKU (não a média, não o catálogo inteiro). */
export function comparePrice(
  normalized: NormalizedPrice,
  lastKnownPriceCents: number | null,
): PriceComparison {
  if (lastKnownPriceCents == null) return "first_capture";
  if (normalized.priceCents === lastKnownPriceCents) return "unchanged";
  return normalized.priceCents > lastKnownPriceCents ? "increased" : "decreased";
}
