"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { extractCampaignAttribution, storeAttribution } from "../lib/campaignAttribution";

/**
 * Guarda UTM/`gclid` da URL em `sessionStorage` a cada navegação que os
 * trouxer (último clique de campanha vence). Não envia nada — só
 * preserva a origem para o GA4 reaplicar se o aceite de cookies vier
 * depois de o visitante já ter mudado de página (ver
 * `campaignAttribution.ts` e `AnalyticsScripts`).
 */
export function AttributionCapture() {
  const pathname = usePathname();

  React.useEffect(() => {
    const attribution = extractCampaignAttribution(window.location.search);
    if (attribution) storeAttribution(attribution);
  }, [pathname]);

  return null;
}
