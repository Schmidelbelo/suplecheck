import { describe, expect, it } from "vitest";
import { breadcrumbSchema, faqPageSchema, itemListSchema, websiteSchema } from "./schema";

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
});
