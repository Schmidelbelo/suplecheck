"use client";

import * as React from "react";
import { trackEvent } from "../services/analytics.service";
import { ANALYTICS_EVENTS } from "../types/event";
import { readStoredAttribution } from "../lib/campaignAttribution";
import { buildOutboundClickEventParams } from "../lib/outboundClickEvent";
import {
  buildOutboundHref,
  type OutboundClickSource,
} from "@/modules/monetization/lib/outboundLinkHref";

export interface TrackedOutboundLinkProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  readonly productSlug: string;
  readonly storeSlug: string | null;
  readonly isAffiliate?: boolean;
  readonly source: OutboundClickSource;
  readonly position?: number | null;
}

/**
 * Link "Ver oferta" — sempre para `/go` (via `buildOutboundHref`, nunca
 * a URL da loja) e, no clique, dispara `outbound_link_clicked` no GA4
 * (conversão da mídia paga). Sem aceite de cookies, `window.gtag` não
 * existe e o evento simplesmente não sai — o `/go` e o registro em
 * `outbound_clicks` continuam iguais. Nunca `preventDefault`: a
 * navegação nunca espera analytics (o gtag do GA4 envia via beacon).
 *
 * Aceita as props de `<a>` para funcionar como filho de `<Button asChild>`.
 */
export const TrackedOutboundLink = React.forwardRef<HTMLAnchorElement, TrackedOutboundLinkProps>(
  function TrackedOutboundLink(
    { productSlug, storeSlug, isAffiliate, source, position, onClick, children, ...anchorProps },
    ref,
  ) {
    function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
      onClick?.(event);
      trackEvent(
        ANALYTICS_EVENTS.OUTBOUND_LINK_CLICKED,
        buildOutboundClickEventParams({
          productSlug,
          storeSlug,
          isAffiliate,
          source,
          position,
          attribution: readStoredAttribution(),
        }),
      );
    }

    return (
      <a
        ref={ref}
        href={buildOutboundHref({ productSlug, source, position })}
        target="_blank"
        rel="noopener noreferrer nofollow"
        {...anchorProps}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  },
);
