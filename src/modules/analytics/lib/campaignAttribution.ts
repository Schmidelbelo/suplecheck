/**
 * Atribuição de campanha (UTM + `gclid`) preservada durante a sessão.
 *
 * Por que existe: o GA4 só lê UTM/`gclid` da URL da página em que é
 * inicializado. Como o GA4 só carrega depois do aceite de cookies (LGPD,
 * ver `AnalyticsScripts`), um visitante vindo de anúncio que navega para
 * outra página antes de aceitar perderia a origem da sessão. A captura
 * guarda esses parâmetros em `sessionStorage` (só no dispositivo, nada é
 * enviado) e o init do GA4 os reaplica quando o aceite acontece.
 *
 * Só parâmetros de campanha — nenhum dado pessoal.
 */
export const CAMPAIGN_ATTRIBUTION_STORAGE_KEY = "suplescore-campaign-attribution";

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/** `gclid` (auto-tagging do Google Ads) — necessário para o GA4 atribuir a sessão ao anúncio. */
export const ATTRIBUTION_KEYS = [...UTM_KEYS, "gclid"] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type CampaignAttribution = Partial<Record<AttributionKey, string>>;

const MAX_VALUE_LENGTH = 200;

/** Extrai só os parâmetros de campanha de uma querystring; `null` quando não há nenhum. */
export function extractCampaignAttribution(search: string): CampaignAttribution | null {
  const params = new URLSearchParams(search);
  const attribution: CampaignAttribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value.slice(0, MAX_VALUE_LENGTH);
  }
  return Object.keys(attribution).length > 0 ? attribution : null;
}

/** Aceita só as chaves conhecidas — o valor vem de `sessionStorage`, nunca confiável como formato. */
export function parseStoredAttribution(raw: string | null): CampaignAttribution | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const attribution: CampaignAttribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "string" && value) attribution[key] = value.slice(0, MAX_VALUE_LENGTH);
    }
    return Object.keys(attribution).length > 0 ? attribution : null;
  } catch {
    return null;
  }
}

/** Só as UTMs, para anexar como parâmetro de evento (o `gclid` nunca vai como parâmetro customizado). */
export function utmEventParams(attribution: CampaignAttribution | null): Record<string, string> {
  if (!attribution) return {};
  const params: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = attribution[key];
    if (value) params[key] = value;
  }
  return params;
}

export function readStoredAttribution(): CampaignAttribution | null {
  try {
    return parseStoredAttribution(window.sessionStorage.getItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeAttribution(attribution: CampaignAttribution): void {
  try {
    window.sessionStorage.setItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage indisponível (modo privado restrito, bloqueio de site data) — segue sem atribuição.
  }
}
