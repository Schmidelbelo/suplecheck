/**
 * Toda a UI usa esta função para linkar para fora do SupleScore — nunca
 * um `href` direto para `presentation.price.url`. Devolve sempre uma
 * URL interna (`/go/...`), que decide o link real (afiliado ou não) e
 * registra o clique antes de redirecionar (ver `src/app/go/[productId]/route.ts`).
 */
export type OutboundClickSource =
  | "product-page"
  | "product-page-mobile-bar"
  | "alternative-recommendation"
  | "related-product"
  | "offers"
  | "assistant-recommendation";

export interface BuildOutboundHrefInput {
  readonly productSlug: string;
  readonly source: OutboundClickSource;
  /** Posição no ranking no momento do clique — omitir quando não houver (ex.: página de produto isolada). */
  readonly position?: number | null;
}

export function buildOutboundHref({
  productSlug,
  source,
  position,
}: BuildOutboundHrefInput): string {
  const params = new URLSearchParams({ source });
  if (position != null) params.set("position", String(position));
  return `/go/${encodeURIComponent(productSlug)}?${params.toString()}`;
}
