import { describe, expect, it } from "vitest";
import { buildAffiliateUrl } from "./affiliateUrl";

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
});
