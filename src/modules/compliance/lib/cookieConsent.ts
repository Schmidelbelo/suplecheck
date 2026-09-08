/**
 * Consentimento de cookies (LGPD) — um único cookie, lido tanto no
 * servidor (`AnalyticsScripts`, decide se injeta GA4/Clarity) quanto no
 * cliente (`CookieConsentBanner`, decide se mostra o banner). Cookie em
 * vez de `localStorage` deliberadamente: precisa estar disponível no
 * primeiro render do servidor, antes de qualquer script de terceiro ser
 * decidido — `localStorage` só existiria depois da hidratação, tarde
 * demais para gatear o carregamento do script.
 */
export const COOKIE_CONSENT_COOKIE_NAME = "suplescore-cookie-consent";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 dias

export type CookieConsentValue = "accepted" | "rejected";

export function isAnalyticsConsentGranted(value: string | undefined | null): boolean {
  return value === "accepted";
}
