import type { AnalyticsEventPayload } from "../types/event";
import type { OutboundClickSource } from "@/modules/monetization/lib/outboundLinkHref";
import { outboundDestinationType } from "@/modules/monetization/lib/outboundDestination";
import { utmEventParams, type CampaignAttribution } from "./campaignAttribution";

export interface OutboundClickEventInput {
  readonly productSlug: string;
  readonly storeSlug: string | null;
  /** Mesma regra do `/go` (`PriceEntry.affiliateUrl` ou `Store.affiliateBaseUrl` reconhecido); `undefined` quando desconhecido. */
  readonly isAffiliate?: boolean;
  readonly source: OutboundClickSource;
  readonly position?: number | null;
  readonly attribution: CampaignAttribution | null;
}

/**
 * Parâmetros do evento `outbound_link_clicked` no GA4 — nunca a URL de
 * destino (tag/deeplink de afiliado não vão para analytics), só slugs e
 * o tipo de destino inferido da loja. Nomes em snake_case, padrão GA4;
 * `click_source` em vez de `source` para não confundir com a dimensão
 * "Origem da sessão".
 */
export function buildOutboundClickEventParams(
  input: OutboundClickEventInput,
): AnalyticsEventPayload {
  return {
    product_slug: input.productSlug,
    store_slug: input.storeSlug ?? "unknown",
    destination_type: outboundDestinationType(input.storeSlug),
    click_source: input.source,
    ...(input.isAffiliate === undefined ? {} : { was_affiliate: input.isAffiliate }),
    ...(input.position == null ? {} : { position: input.position }),
    ...utmEventParams(input.attribution),
  };
}
