/**
 * Tipo de destino de um clique de saída, inferido só do `Store.slug` —
 * nunca da URL (que pode carregar tag/deeplink de afiliado e não deve
 * ir para analytics). Serve para segmentar o evento de clique no GA4
 * sem expor nada sensível.
 */
export type OutboundDestinationType = "amazon" | "mercado_livre" | "other";

const DESTINATION_BY_STORE_SLUG: Readonly<Record<string, OutboundDestinationType>> = {
  "amazon-br": "amazon",
  "mercado-livre": "mercado_livre",
};

export function outboundDestinationType(
  storeSlug: string | null | undefined,
): OutboundDestinationType {
  return (storeSlug && DESTINATION_BY_STORE_SLUG[storeSlug]) || "other";
}
