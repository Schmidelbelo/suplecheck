/**
 * Único lugar do projeto que decide a URL final de um clique de saída —
 * nenhuma UI monta esse link diretamente (ver `src/app/go/[productId]/route.ts`,
 * o único chamador real). Não inventa parâmetro de nenhum programa de
 * afiliado real (Amazon Associates, Awin, Rakuten...) — cada rede tem um
 * formato próprio que só existe quando o comercial contrata o programa.
 *
 * `Store.affiliateBaseUrl` aceita DOIS formatos, cobrindo os dois modelos
 * reais de atribuição encontrados na auditoria (`AFFILIATES.md`, seção 3):
 *
 * 1. **Wrapper de terceiro** (Awin, Lomadee, Rakuten...) — um template
 *    contendo o literal `{url}` no ponto onde a URL de destino (codificada)
 *    deve entrar, ex.:
 *    `"https://rede-afiliados.example/click?merchant=123&url={url}"`
 *
 * 2. **Parâmetro anexado ao próprio domínio** (Amazon Associates — a *tag*
 *    é acrescentada à própria URL do produto, não a um wrapper de terceiro)
 *    — uma querystring pura, sem `{url}` e sem `://`, ex.: `"tag=nossatag-20"`.
 *    É mesclada na URL de destino preservando os parâmetros que já existirem.
 *
 * Qualquer outro valor (vazio, malformado, ou um wrapper esquecido de
 * incluir `{url}`) cai para a URL normal — nunca inventamos um link.
 */
export interface AffiliateUrlStore {
  readonly isAffiliate: boolean;
  readonly affiliateBaseUrl: string | null;
}

export interface AffiliateUrlInput {
  readonly destinationUrl: string;
  readonly store: AffiliateUrlStore;
}

export interface AffiliateUrlResult {
  readonly url: string;
  /**
   * `true` só quando a URL retornada é realmente um link de afiliado.
   * `false` cobre casos bem diferentes, todos caindo para a URL
   * normal — nunca inventamos um link: a loja não tem programa
   * (`isAffiliate: false`), tem (`isAffiliate: true`) mas
   * `affiliateBaseUrl` ainda não foi configurado pelo comercial, ou o
   * valor configurado não corresponde a nenhum dos dois formatos aceitos.
   */
  readonly isAffiliateLink: boolean;
}

const URL_PLACEHOLDER = "{url}";

/** Reconhece uma querystring pura (`tag=x` ou `?tag=x&outro=y`) — nunca uma URL completa. */
function isQueryStringFragment(value: string): boolean {
  return !value.includes("://") && !value.includes(URL_PLACEHOLDER) && /^[?&]?[^=&\s]+=[^\s]+/.test(value);
}

export function buildAffiliateUrl({
  destinationUrl,
  store,
}: AffiliateUrlInput): AffiliateUrlResult {
  if (!store.isAffiliate || !store.affiliateBaseUrl) {
    return { url: destinationUrl, isAffiliateLink: false };
  }

  const config = store.affiliateBaseUrl;

  if (config.includes(URL_PLACEHOLDER)) {
    const url = config.replace(URL_PLACEHOLDER, encodeURIComponent(destinationUrl));
    return { url, isAffiliateLink: true };
  }

  if (isQueryStringFragment(config)) {
    try {
      const url = new URL(destinationUrl);
      const params = new URLSearchParams(config.replace(/^[?&]/, ""));
      for (const [key, value] of params) {
        url.searchParams.set(key, value);
      }
      return { url: url.toString(), isAffiliateLink: true };
    } catch {
      return { url: destinationUrl, isAffiliateLink: false };
    }
  }

  return { url: destinationUrl, isAffiliateLink: false };
}
