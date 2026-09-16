import { describe, expect, it } from "vitest";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  productSchema,
  websiteSchema,
} from "./schema";

const baseProductInput = {
  name: "Creatina Exemplo 300g",
  description: "Descrição real do produto.",
  image: "/products/default-card.webp",
  slug: "creatina-exemplo-300g",
  categorySlug: "creatina",
  brand: "Marca Exemplo",
};

describe("SEO schemas", () => {
  it("adds WebSite SearchAction to the real catalog search URL", () => {
    expect(websiteSchema()).toMatchObject({
      "@type": "WebSite",
      potentialAction: {
        "@type": "SearchAction",
        target: expect.stringContaining("/creatina?q={search_term_string}"),
        "query-input": "required name=search_term_string",
      },
    });
  });

  it("builds breadcrumb JSON-LD with absolute item URLs", () => {
    expect(
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Marcas", href: "/marcas" },
      ]),
    ).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: expect.stringMatching(/\/$/) },
        {
          "@type": "ListItem",
          position: 2,
          name: "Marcas",
          item: expect.stringContaining("/marcas"),
        },
      ],
    });
  });

  it("builds ItemList and FAQPage JSON-LD from visible page data", () => {
    expect(itemListSchema([{ name: "Produto A", href: "/creatina/produto-a" }])).toMatchObject({
      "@type": "ItemList",
      itemListElement: [{ position: 1, name: "Produto A" }],
    });

    expect(faqPageSchema([{ question: "Pergunta?", answer: "Resposta." }])).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Pergunta?",
          acceptedAnswer: { "@type": "Answer", text: "Resposta." },
        },
      ],
    });
  });

  describe("productSchema — availability nunca é inventada", () => {
    it("usa https://schema.org/InStock quando PriceEntry.availability é IN_STOCK", () => {
      const result = productSchema({
        ...baseProductInput,
        priceInCents: 8990,
        availability: "IN_STOCK",
      });
      expect(result).toMatchObject({
        offers: { "@type": "Offer", availability: "https://schema.org/InStock" },
      });
    });

    it("usa https://schema.org/OutOfStock quando PriceEntry.availability é OUT_OF_STOCK", () => {
      const result = productSchema({
        ...baseProductInput,
        priceInCents: 8990,
        availability: "OUT_OF_STOCK",
      });
      expect(result).toMatchObject({
        offers: { "@type": "Offer", availability: "https://schema.org/OutOfStock" },
      });
    });

    it("omite o campo availability quando o valor real é UNKNOWN — nunca cai num default", () => {
      const result = productSchema({
        ...baseProductInput,
        priceInCents: 8990,
        availability: "UNKNOWN",
      });
      expect(result.offers).not.toHaveProperty("availability");
    });

    it("omite o campo availability quando nenhum valor foi informado", () => {
      const result = productSchema({ ...baseProductInput, priceInCents: 8990 });
      expect(result.offers).not.toHaveProperty("availability");
    });

    it("não inclui offers quando não há priceInCents — nunca inventa preço", () => {
      const result = productSchema(baseProductInput);
      expect(result).not.toHaveProperty("offers");
    });
  });
});
