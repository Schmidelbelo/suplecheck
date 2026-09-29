import { describe, expect, it } from "vitest";
import { buildOutboundClickEventParams } from "./outboundClickEvent";

describe("buildOutboundClickEventParams", () => {
  it("builds the GA4 payload for an Amazon affiliate click with campaign attribution", () => {
    expect(
      buildOutboundClickEventParams({
        productSlug: "max-titanium-creatina-300g",
        storeSlug: "amazon-br",
        isAffiliate: true,
        source: "product-page",
        position: 2,
        attribution: { utm_source: "google", utm_medium: "cpc", gclid: "abc" },
      }),
    ).toEqual({
      product_slug: "max-titanium-creatina-300g",
      store_slug: "amazon-br",
      destination_type: "amazon",
      click_source: "product-page",
      was_affiliate: true,
      position: 2,
      utm_source: "google",
      utm_medium: "cpc",
    });
  });

  it("omits was_affiliate and position when unknown", () => {
    const params = buildOutboundClickEventParams({
      productSlug: "growth-oleo-de-peixe-ultra-75-capsulas",
      storeSlug: "mercado-livre",
      source: "offers",
      position: null,
      attribution: null,
    });
    expect(params).toEqual({
      product_slug: "growth-oleo-de-peixe-ultra-75-capsulas",
      store_slug: "mercado-livre",
      destination_type: "mercado_livre",
      click_source: "offers",
    });
  });

  it("keeps a false affiliate flag and never includes a URL", () => {
    const params = buildOutboundClickEventParams({
      productSlug: "x",
      storeSlug: null,
      isAffiliate: false,
      source: "ranking",
      attribution: null,
    });
    expect(params).toMatchObject({
      store_slug: "unknown",
      destination_type: "other",
      was_affiliate: false,
    });
    expect(Object.values(params).some((v) => typeof v === "string" && v.includes("://"))).toBe(
      false,
    );
  });
});
