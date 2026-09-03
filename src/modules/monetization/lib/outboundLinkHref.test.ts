import { describe, expect, it } from "vitest";
import { buildOutboundHref } from "./outboundLinkHref";

describe("buildOutboundHref", () => {
  it("builds a /go/ href with the source always present", () => {
    expect(buildOutboundHref({ productSlug: "creatina-300g", source: "product-page" })).toBe(
      "/go/creatina-300g?source=product-page",
    );
  });

  it("includes position only when provided", () => {
    expect(
      buildOutboundHref({ productSlug: "creatina-300g", source: "related-product", position: 3 }),
    ).toBe("/go/creatina-300g?source=related-product&position=3");
  });

  it("omits position when null or undefined", () => {
    expect(
      buildOutboundHref({ productSlug: "creatina-300g", source: "offers", position: null }),
    ).toBe("/go/creatina-300g?source=offers");
  });

  it("URL-encodes the product slug", () => {
    expect(buildOutboundHref({ productSlug: "produto com espaço", source: "product-page" })).toBe(
      "/go/produto%20com%20espa%C3%A7o?source=product-page",
    );
  });
});
