import { describe, expect, it } from "vitest";
import { buildAffiliateUrl, isRecognizedAffiliateBaseUrlFormat } from "./affiliateUrl";

describe("buildAffiliateUrl", () => {
  it("returns the destination URL unchanged when the store has no affiliate program", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://loja.example/produto/123",
      store: { isAffiliate: false, affiliateBaseUrl: null },
    });

    expect(result).toEqual({ url: "https://loja.example/produto/123", isAffiliateLink: false });
  });

  it("wraps the destination URL through affiliateBaseUrl when the store is a real, configured affiliate", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://loja.example/produto/123",
      store: {
        isAffiliate: true,
        affiliateBaseUrl: "https://rede-afiliados.example/click?merchant=42&url={url}",
      },
    });

    expect(result).toEqual({
      url: "https://rede-afiliados.example/click?merchant=42&url=https%3A%2F%2Floja.example%2Fproduto%2F123",
      isAffiliateLink: true,
    });
  });

  it("falls back to the destination URL when isAffiliate is true but affiliateBaseUrl was never configured", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://loja.example/produto/123",
      store: { isAffiliate: true, affiliateBaseUrl: null },
    });

    expect(result).toEqual({ url: "https://loja.example/produto/123", isAffiliateLink: false });
  });

  it("falls back to the destination URL when affiliateBaseUrl is set but missing the {url} placeholder", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://loja.example/produto/123",
      store: {
        isAffiliate: true,
        affiliateBaseUrl: "https://rede-afiliados.example/click?merchant=42",
      },
    });

    expect(result).toEqual({ url: "https://loja.example/produto/123", isAffiliateLink: false });
  });

  it("URL-encodes the destination URL when substituting into the template", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://loja.example/busca?q=creatina+300g&ref=site",
      store: { isAffiliate: true, affiliateBaseUrl: "https://rede.example/go?u={url}" },
    });

    expect(result.url).toBe(
      `https://rede.example/go?u=${encodeURIComponent("https://loja.example/busca?q=creatina+300g&ref=site")}`,
    );
  });

  it("appends a query-string affiliateBaseUrl to the destination URL (Amazon Associates-style tag)", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://amazon.com.br/produto/dp/B123",
      store: { isAffiliate: true, affiliateBaseUrl: "tag=nossatag-20" },
    });

    expect(result).toEqual({
      url: "https://amazon.com.br/produto/dp/B123?tag=nossatag-20",
      isAffiliateLink: true,
    });
  });

  it("preserves existing query params while appending the affiliate tag", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://amazon.com.br/produto/dp/B123?th=1",
      store: { isAffiliate: true, affiliateBaseUrl: "tag=nossatag-20" },
    });

    expect(result.url).toBe("https://amazon.com.br/produto/dp/B123?th=1&tag=nossatag-20");
    expect(result.isAffiliateLink).toBe(true);
  });

  it("accepts a leading '?' on the query-string affiliateBaseUrl", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://amazon.com.br/produto/dp/B123",
      store: { isAffiliate: true, affiliateBaseUrl: "?tag=nossatag-20" },
    });

    expect(result.url).toBe("https://amazon.com.br/produto/dp/B123?tag=nossatag-20");
  });

  it("falls back to the destination URL when the query-string affiliateBaseUrl doesn't match a valid destination URL", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "not a valid url",
      store: { isAffiliate: true, affiliateBaseUrl: "tag=nossatag-20" },
    });

    expect(result).toEqual({ url: "not a valid url", isAffiliateLink: false });
  });

  it("reflects the real Netshoes state today: isAffiliate=true but affiliateBaseUrl still unconfigured falls back to the direct URL", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://www.netshoes.com.br/produto/creatina-probiotica-300g",
      store: { isAffiliate: true, affiliateBaseUrl: null },
    });

    expect(result).toEqual({
      url: "https://www.netshoes.com.br/produto/creatina-probiotica-300g",
      isAffiliateLink: false,
    });
  });

  describe("lojas oficiais com affiliateBaseUrl gravado como URL institucional (não um link de afiliado)", () => {
    // Valores reais encontrados em produção (docs/AUDITORIA_AFFILIATE_BASE_URLS.md) —
    // nenhum tem "://" ausente nem "{url}", então nenhum bate no formato
    // wrapper nem no formato querystring: buildAffiliateUrl precisa cair
    // pra URL direta mesmo com isAffiliate=true, como já fazia antes desta
    // auditoria — este teste apenas fixa esse comportamento pros 4 casos
    // reais que motivaram a correção.
    const casosReais = [
      ["vitafor-oficial", "https://www.vitafor.com.br"],
      ["dux-oficial", "https://duxhumanhealth.com"],
      ["integralmedica-oficial", "https://www.integralmedica.com.br"],
      ["max-titanium-oficial", "https://www.maxtitanium.com.br"],
    ] as const;

    it.each(casosReais)(
      "%s: affiliateBaseUrl é a homepage da marca, não um link de afiliado — /go cai pra URL direta",
      (_storeSlug, affiliateBaseUrl) => {
        const result = buildAffiliateUrl({
          destinationUrl: "https://loja.example/produto/123",
          store: { isAffiliate: true, affiliateBaseUrl },
        });

        expect(result).toEqual({ url: "https://loja.example/produto/123", isAffiliateLink: false });
        expect(isRecognizedAffiliateBaseUrlFormat(affiliateBaseUrl)).toBe(false);
      },
    );
  });
});

describe("buildAffiliateUrl — redes de wrapper reais citadas em AFFILIATES.md", () => {
  // Formatos confirmados na auditoria (AFFILIATES.md, seção 3) — nenhum ID
  // real é usado aqui, só o formato de wrapper de cada rede, para travar que
  // a arquitetura já suporta os três quando o comercial trouxer os dados.
  it("Lomadee: sourceId vai na query do wrapper, {url} é substituído pela URL de destino", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://www.growthsupplements.com.br/creatina-300g",
      store: {
        isAffiliate: true,
        affiliateBaseUrl:
          "https://redir.lomadee.com/v2/deeplink?url={url}&sourceId=NOSSO_SOURCE_ID",
      },
    });

    expect(result).toEqual({
      url: `https://redir.lomadee.com/v2/deeplink?url=${encodeURIComponent("https://www.growthsupplements.com.br/creatina-300g")}&sourceId=NOSSO_SOURCE_ID`,
      isAffiliateLink: true,
    });
  });

  it("Awin: awinmid/awinaffid ficam fixos no wrapper, {url} (ued) é substituído", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://www.darklab.com.br/pre-treino",
      store: {
        isAffiliate: true,
        affiliateBaseUrl:
          "https://www.awin1.com/cread.php?awinmid=123&awinaffid=NOSSO_ID&ued={url}",
      },
    });

    expect(result).toEqual({
      url: `https://www.awin1.com/cread.php?awinmid=123&awinaffid=NOSSO_ID&ued=${encodeURIComponent("https://www.darklab.com.br/pre-treino")}`,
      isAffiliateLink: true,
    });
  });

  it("Rakuten: mesma família de wrapper (id/u), {url} é substituído normalmente", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://www.netshoes.com.br/produto/whey-3w",
      store: {
        isAffiliate: true,
        affiliateBaseUrl: "https://track.rakuten.example/click?id=NOSSO_ID&u={url}",
      },
    });

    expect(result).toEqual({
      url: `https://track.rakuten.example/click?id=NOSSO_ID&u=${encodeURIComponent("https://www.netshoes.com.br/produto/whey-3w")}`,
      isAffiliateLink: true,
    });
  });
});

describe("buildAffiliateUrl — programas de cupom (não rastreáveis por URL)", () => {
  // Adaptogen, Probiótica e afins (AFFILIATES.md) atribuem venda por cupom no
  // checkout, não por link. Sem wrapper nem querystring reais para configurar,
  // affiliateBaseUrl fica vazio (null) — o redirect deve continuar sendo a URL
  // direta, igual a qualquer loja não-afiliada. Isto não é suportado hoje por
  // buildAffiliateUrl e não deveria ser — é a mesma limitação estrutural já
  // documentada (precisaria de uma feature de exibir/aplicar cupom).
  it("loja com programa de cupom e affiliateBaseUrl não configurado cai para a URL direta", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://www.adaptogen.com.br/tasty-whey-900g",
      store: { isAffiliate: true, affiliateBaseUrl: null },
    });

    expect(result).toEqual({
      url: "https://www.adaptogen.com.br/tasty-whey-900g",
      isAffiliateLink: false,
    });
  });

  it("um cupom salvo por engano em affiliateBaseUrl (sem '{url}' nem '=') não é reconhecido como link de afiliado", () => {
    const cupom = "SUPLESCORE10";

    expect(isRecognizedAffiliateBaseUrlFormat(cupom)).toBe(false);

    const result = buildAffiliateUrl({
      destinationUrl: "https://www.probiotica.com.br/sou-pro",
      store: { isAffiliate: true, affiliateBaseUrl: cupom },
    });

    expect(result).toEqual({
      url: "https://www.probiotica.com.br/sou-pro",
      isAffiliateLink: false,
    });
  });
});

describe("buildAffiliateUrl — proteção contra open redirect", () => {
  it("rejeita destinationUrl com protocolo não-http(s) (ex.: javascript:) mesmo com wrapper configurado", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "javascript:alert(1)",
      store: {
        isAffiliate: true,
        affiliateBaseUrl: "https://redir.lomadee.com/v2/deeplink?url={url}&sourceId=X",
      },
    });

    expect(result).toEqual({ url: "javascript:alert(1)", isAffiliateLink: false });
  });

  it("cai para a URL direta quando o wrapper substituído resulta num protocolo inseguro", () => {
    const result = buildAffiliateUrl({
      destinationUrl: "https://loja.example/produto/123",
      store: { isAffiliate: true, affiliateBaseUrl: "javascript:{url}" },
    });

    expect(result).toEqual({ url: "https://loja.example/produto/123", isAffiliateLink: false });
  });
});

describe("isRecognizedAffiliateBaseUrlFormat", () => {
  it("reconhece um wrapper com {url}", () => {
    expect(isRecognizedAffiliateBaseUrlFormat("https://rede.example/click?url={url}")).toBe(true);
  });

  it("reconhece uma querystring pura (modelo Amazon Associates)", () => {
    expect(isRecognizedAffiliateBaseUrlFormat("tag=suplescore-20")).toBe(true);
  });

  it("rejeita uma URL completa sem {url} (homepage/institucional salva por engano)", () => {
    expect(isRecognizedAffiliateBaseUrlFormat("https://www.vitafor.com.br")).toBe(false);
  });
});
