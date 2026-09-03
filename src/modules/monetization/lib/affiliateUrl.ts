/**
 * Único lugar do projeto que decide a URL final de um clique de saída —
 * nenhuma UI monta esse link diretamente (ver `src/app/go/[productId]/route.ts`,
 * o único chamador real). Não inventa parâmetro de nenhum programa de
 * afiliado real (Amazon Associates, Awin, Rakuten...) — cada rede tem um
 * formato próprio que só existe quando o comercial contrata o programa.
 *
 * Contrato que ESTE projeto define para `Store.affiliateBaseUrl`: um
 * template contendo o literal `{url}` no ponto onde a URL de destino
 * (codificada) deve entrar. Quando um programa de afiliado real for
 * contratado para uma loja, popular `affiliateBaseUrl` seguindo esse
 * contrato ativa o link de afiliado sem nenhuma mudança de código —
 * ex.: uma rede de deep-link no formato
 * `https://rede-afiliados.example/click?merchant=123&url={url}`.
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
   * `false` cobre dois casos bem diferentes, ambos caindo para a URL
   * normal — nunca inventamos um link: a loja não tem programa
   * (`isAffiliate: false`), ou tem (`isAffiliate: true`) mas
   * `affiliateBaseUrl` ainda não foi configurado pelo comercial.
   */
  readonly isAffiliateLink: boolean;
}

const URL_PLACEHOLDER = "{url}";

export function buildAffiliateUrl({
  destinationUrl,
  store,
}: AffiliateUrlInput): AffiliateUrlResult {
  if (store.isAffiliate && store.affiliateBaseUrl?.includes(URL_PLACEHOLDER)) {
    const url = store.affiliateBaseUrl.replace(URL_PLACEHOLDER, encodeURIComponent(destinationUrl));
    return { url, isAffiliateLink: true };
  }
  return { url: destinationUrl, isAffiliateLink: false };
}
