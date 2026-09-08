import Script from "next/script";
import { cookies } from "next/headers";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  isAnalyticsConsentGranted,
} from "@/modules/compliance/lib/cookieConsent";

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
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
              window.gtag = gtag;
            `}
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
