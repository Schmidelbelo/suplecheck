import { prisma } from "@/lib/db/prisma";
import { container } from "@/lib/container";
import { LastKnownPriceScraperProvider, type PriceScraperPort } from "./PriceScraperPort";
import {
  validateCapturedPrice,
  normalizeCapturedPrice,
  comparePrice,
  InvalidPriceCaptureError,
  type PriceComparison,
} from "./steps";
import {
  mapWithConcurrency,
  withTimeout,
  withRetry,
  DomainRateLimiter,
  TimeoutError,
} from "./concurrency";

const JOB_SOURCE = "price-capture-job";
const CONCURRENCY = 3;
const TIMEOUT_MS = 10_000;
const RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;
const MIN_INTERVAL_PER_DOMAIN_MS = 500;

export interface PriceCaptureItemResult {
  readonly skuId: string;
  readonly productName: string;
  readonly comparison: PriceComparison;
  readonly oldPriceCents: number | null;
  readonly newPriceCents: number;
  readonly error: string | null;
}

export interface PriceCaptureJobSummary {
  readonly importBatchId: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly totalProducts: number;
  readonly updated: number;
  readonly unchanged: number;
  readonly increased: number;
  readonly decreased: number;
  readonly failed: number;
  readonly items: readonly PriceCaptureItemResult[];
}

interface SkuToCapture {
  readonly skuId: string;
  readonly productId: string;
  readonly productName: string;
  readonly storeId: string;
  readonly url: string | null;
  readonly lastKnownPriceCents: number | null;
}

async function loadSkusToCapture(skuIds?: readonly string[]): Promise<SkuToCapture[]> {
  const skus = await prisma.sku.findMany({
    where: skuIds ? { status: "ACTIVE", id: { in: [...skuIds] } } : { status: "ACTIVE" },
    include: {
      product: { select: { id: true, name: true } },
      priceEntries: { orderBy: { capturedAt: "desc" as const }, take: 1, include: { store: true } },
    },
  });

  return skus
    .filter((sku) => sku.priceEntries[0] != null) // sem nenhuma captura anterior, não sabemos em qual loja checar — fora de escopo desta versão do job
    .map((sku) => {
      const lastEntry = sku.priceEntries[0]!;
      return {
        skuId: sku.id,
        productId: sku.product.id,
        productName: sku.product.name,
        storeId: lastEntry.storeId,
        url: lastEntry.url,
        lastKnownPriceCents: lastEntry.priceCents,
      };
    });
}

function domainOf(url: string | null): string {
  if (!url) return "unknown";
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

/**
 * Orquestra o pipeline completo: Scraper → Validação → Normalização →
 * Comparação → Persistência → Histórico → Atualização do Product,
 * para todos os SKUs ativos, com concorrência controlada, retry,
 * timeout e rate limit por domínio de loja. Cada execução vira uma
 * linha em `ImportBatch` (fonte "price-capture-job") — é o mesmo
 * mecanismo de rastreamento de lote já usado pelo Data Pipeline para
 * qualquer origem de dado (Domain Model §3.9).
 */
export async function runPriceCaptureJob(
  scraper: PriceScraperPort = new LastKnownPriceScraperProvider(),
  /** Restringe a execução a SKUs específicos — usado por testes (para não tocar o catálogo real) e por uma futura recaptura sob demanda de um único produto. */
  options: { skuIds?: readonly string[] } = {},
): Promise<PriceCaptureJobSummary> {
  const logger = container.logger.child({ module: "price-capture-job" });
  const startedAt = new Date();
  logger.info("Iniciando captura de preços", { startedAt: startedAt.toISOString() });

  const skus = await loadSkusToCapture(options.skuIds);
  const batch = await prisma.importBatch.create({
    data: { source: JOB_SOURCE, status: "PROCESSING", totalRecords: skus.length },
  });

  const rateLimiter = new DomainRateLimiter(MIN_INTERVAL_PER_DOMAIN_MS);
  const items: PriceCaptureItemResult[] = [];

  await mapWithConcurrency(skus, CONCURRENCY, async (sku) => {
    try {
      await rateLimiter.wait(domainOf(sku.url));

      const result = await withRetry(
        () =>
          withTimeout(
            scraper.fetchPrice({
              skuId: sku.skuId,
              storeId: sku.storeId,
              url: sku.url,
              lastKnownPriceCents: sku.lastKnownPriceCents ?? 0,
            }),
            TIMEOUT_MS,
          ),
        {
          retries: RETRIES,
          baseDelayMs: RETRY_BASE_DELAY_MS,
          isRetryable: (error) => !(error instanceof InvalidPriceCaptureError),
        },
      );

      validateCapturedPrice(result, sku.lastKnownPriceCents);
      const normalized = normalizeCapturedPrice(result);
      const comparison = comparePrice(normalized, sku.lastKnownPriceCents);

      await prisma.priceEntry.create({
        data: {
          skuId: sku.skuId,
          storeId: sku.storeId,
          priceCents: normalized.priceCents,
          availability: normalized.availability,
          importBatchId: batch.id,
        },
      });
      // "Atualização do Product": toca `updatedAt` para que o sitemap
      // (lastModified) e qualquer cache por data reflitam que este
      // produto teve movimento real, mesmo sem mudar campos próprios.
      await prisma.product.update({
        where: { id: sku.productId },
        data: { updatedAt: new Date() },
      });

      logger.info("Preço capturado", {
        skuId: sku.skuId,
        product: sku.productName,
        comparison,
        oldPriceCents: sku.lastKnownPriceCents,
        newPriceCents: normalized.priceCents,
      });

      items.push({
        skuId: sku.skuId,
        productName: sku.productName,
        comparison,
        oldPriceCents: sku.lastKnownPriceCents,
        newPriceCents: normalized.priceCents,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof TimeoutError
          ? "Tempo limite excedido"
          : error instanceof Error
            ? error.message
            : "Erro desconhecido";

      logger.warn("Falha ao capturar preço", {
        skuId: sku.skuId,
        product: sku.productName,
        error: message,
      });

      await prisma.importRecordError.create({
        data: {
          importBatchId: batch.id,
          stage: "VALIDATION",
          severity: "ERROR",
          errorMessage: message,
          rawData: { skuId: sku.skuId, productName: sku.productName, url: sku.url },
        },
      });

      items.push({
        skuId: sku.skuId,
        productName: sku.productName,
        comparison: "unchanged",
        oldPriceCents: sku.lastKnownPriceCents,
        newPriceCents: sku.lastKnownPriceCents ?? 0,
        error: message,
      });
    }
  });

  const failed = items.filter((i) => i.error !== null).length;
  const succeeded = items.length - failed;
  const finishedAt = new Date();

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: failed === 0 ? "COMPLETED" : succeeded === 0 ? "FAILED" : "COMPLETED_WITH_ERRORS",
      importedRecords: succeeded,
      failedRecords: failed,
      finishedAt,
    },
  });

  const summary: PriceCaptureJobSummary = {
    importBatchId: batch.id,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    totalProducts: items.length,
    updated: items.filter((i) => !i.error && i.comparison !== "unchanged").length,
    unchanged: items.filter((i) => !i.error && i.comparison === "unchanged").length,
    increased: items.filter((i) => !i.error && i.comparison === "increased").length,
    decreased: items.filter((i) => !i.error && i.comparison === "decreased").length,
    failed,
    items,
  };

  logger.info("Captura de preços concluída", {
    importBatchId: summary.importBatchId,
    durationMs: summary.durationMs,
    totalProducts: summary.totalProducts,
    updated: summary.updated,
    failed: summary.failed,
  });

  return summary;
}
