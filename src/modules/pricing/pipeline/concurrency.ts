/**
 * Utilitários de execução controlada — sem dependência nova (p-limit,
 * p-retry): o volume do catálogo hoje (dezenas de produtos) não
 * justifica uma lib inteira para isto, e a lógica é pequena o
 * suficiente para ser auditável a olho.
 */

/** Executa `items` através de `worker`, no máximo `concurrency` por vez. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runNext(): Promise<void> {
    const index = cursor++;
    if (index >= items.length) return;
    results[index] = await worker(items[index]!, index);
    await runNext();
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runNext));
  return results;
}

export class TimeoutError extends Error {
  constructor(message = "Operação excedeu o tempo limite") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Retry com backoff exponencial simples — não tenta de novo em `InvalidPriceCaptureError` (erro de dado, não transitório). */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries: number; baseDelayMs: number; isRetryable?: (error: unknown) => boolean },
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = options.isRetryable?.(error) ?? true;
      if (!retryable || attempt === options.retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, options.baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
}

/**
 * Espaçamento mínimo entre requisições ao mesmo domínio de loja —
 * mesmo sem scraper real hoje, deixa a proteção já pronta para quando
 * houver requisições HTTP de verdade (evita sobrecarregar a loja).
 */
export class DomainRateLimiter {
  private readonly lastRequestAt = new Map<string, number>();

  constructor(private readonly minIntervalMs: number) {}

  async wait(domain: string): Promise<void> {
    const last = this.lastRequestAt.get(domain);
    const now = Date.now();
    if (last != null) {
      const elapsed = now - last;
      if (elapsed < this.minIntervalMs) {
        await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
      }
    }
    this.lastRequestAt.set(domain, Date.now());
  }
}
