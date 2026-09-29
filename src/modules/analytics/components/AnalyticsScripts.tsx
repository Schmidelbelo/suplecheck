import Script from "next/script";
import { cookies } from "next/headers";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  isAnalyticsConsentGranted,
} from "@/modules/compliance/lib/cookieConsent";
import {
  ATTRIBUTION_KEYS,
  CAMPAIGN_ATTRIBUTION_STORAGE_KEY,
} from "@/modules/analytics/lib/campaignAttribution";

const ATTRIBUTION_APPLIED_STORAGE_KEY = "suplescore-campaign-attribution-applied";
const GA_DEBUG_STORAGE_KEY = "suplescore-ga-debug";

/**
 * Init do GA4. Além do `config` padrão:
 *
 * - **Atribuição preservada**: se a página atual não tem UTM/`gclid` mas a
 *   sessão guardou uma de uma página anterior (`AttributionCapture`; caso
 *   típico: visitante de anúncio aceita cookies depois de navegar), a
 *   primeira inicialização da sessão usa um `page_location` com esses
 *   parâmetros — mecanismo padrão do GA4 para atribuir a sessão. Só uma
 *   vez por sessão, para não repetir UTM em todo page_view.
 * - **DebugView**: `?ga_debug=1` em qualquer URL liga `debug_mode` pelo
 *   resto da sessão (validação no GA4 > Admin > DebugView). Sem o
 *   parâmetro, `debug_mode` nem é enviado (qualquer valor o ativaria).
 */
function gaInitScript(gaId: string): string {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    var cfg = { anonymize_ip: true };
    try {
      var url = new URL(window.location.href);
      var keys = ${JSON.stringify(ATTRIBUTION_KEYS)};
      var store = window.sessionStorage;
      var hasCampaign = keys.some(function (k) { return url.searchParams.has(k); });
      if (!hasCampaign && !store.getItem(${JSON.stringify(ATTRIBUTION_APPLIED_STORAGE_KEY)})) {
        var saved = JSON.parse(store.getItem(${JSON.stringify(CAMPAIGN_ATTRIBUTION_STORAGE_KEY)}) || "null");
        if (saved && typeof saved === "object") {
          keys.forEach(function (k) {
            if (typeof saved[k] === "string" && saved[k]) url.searchParams.set(k, saved[k]);
          });
          cfg.page_location = url.toString();
        }
      }
      store.setItem(${JSON.stringify(ATTRIBUTION_APPLIED_STORAGE_KEY)}, "1");
      if (url.searchParams.get("ga_debug") === "1") store.setItem(${JSON.stringify(GA_DEBUG_STORAGE_KEY)}, "1");
      if (store.getItem(${JSON.stringify(GA_DEBUG_STORAGE_KEY)}) === "1") cfg.debug_mode = true;
    } catch (e) {}
    gtag('config', ${JSON.stringify(gaId)}, cfg);
  `;
}

/**
 * Injeta os scripts de terceiros (Google Analytics, Microsoft Clarity)
 * apenas quando os respectivos IDs estão configurados via env E o
 * visitante já aceitou cookies de análise (LGPD — ver
 * `CookieConsentBanner`). Sem o aceite, nada é injetado, mesmo com IDs
 * configurados — evita disparar tracking antes do consentimento.
 */
export async function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  const consentCookie = (await cookies()).get(COOKIE_CONSENT_COOKIE_NAME)?.value;
  const hasConsent = isAnalyticsConsentGranted(consentCookie);

  if (!hasConsent) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {gaInitScript(gaId)}
          </Script>
        </>
      ) : null}

      {clarityId ? (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      ) : null}
    </>
  );
}
