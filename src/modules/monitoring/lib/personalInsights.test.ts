import { describe, expect, it } from "vitest";
import { generatePersonalInsights, type PersonalInsightsInput } from "./personalInsights";

function baseInput(overrides: Partial<PersonalInsightsInput> = {}): PersonalInsightsInput {
  return {
    viewedProducts: [],
    favoritesCount: 0,
    recommendationBudgetsCents: [],
    comparisonSpreads: [],
    ...overrides,
  };
}

describe("generatePersonalInsights", () => {
  it("returns no sentences for a completely empty input", () => {
    expect(generatePersonalInsights(baseInput())).toEqual([]);
  });

  it("names the most-viewed brand only when it clearly leads with 2+ distinct products", () => {
    const withLead = generatePersonalInsights(
      baseInput({
        viewedProducts: [
          { slug: "a", productName: "A", brandName: "Growth", visitCount: 1 },
          { slug: "b", productName: "B", brandName: "Growth", visitCount: 1 },
          { slug: "c", productName: "C", brandName: "Dux", visitCount: 1 },
        ],
      }),
    );
    expect(withLead.some((s) => s.includes("marca Growth"))).toBe(true);

    const singleProduct = generatePersonalInsights(
      baseInput({
        viewedProducts: [{ slug: "a", productName: "A", brandName: "Growth", visitCount: 5 }],
      }),
    );
    expect(singleProduct.some((s) => s.includes("marca"))).toBe(false);
  });

  it("does not name a brand when two brands tie for the lead", () => {
    const tied = generatePersonalInsights(
      baseInput({
        viewedProducts: [
          { slug: "a", productName: "A", brandName: "Growth", visitCount: 1 },
          { slug: "b", productName: "B", brandName: "Growth", visitCount: 1 },
          { slug: "c", productName: "C", brandName: "Dux", visitCount: 1 },
          { slug: "d", productName: "D", brandName: "Dux", visitCount: 1 },
        ],
      }),
    );
    expect(tied.some((s) => s.includes("marca"))).toBe(false);
  });

  it("reports the average budget only when at least one recommendation was made", () => {
    const sentences = generatePersonalInsights(
      baseInput({ recommendationBudgetsCents: [10000, 20000] }),
    );
    expect(sentences.some((s) => s.includes("orçamento médio"))).toBe(true);
  });

  it("reports the most viewed product only with 2 or more visits", () => {
    const withEnoughVisits = generatePersonalInsights(
      baseInput({
        viewedProducts: [
          { slug: "a", productName: "Creatina X", brandName: "Growth", visitCount: 3 },
        ],
      }),
    );
    expect(withEnoughVisits).toContain("Você visualizou Creatina X 3 vezes.");

    const singleVisit = generatePersonalInsights(
      baseInput({
        viewedProducts: [
          { slug: "a", productName: "Creatina X", brandName: "Growth", visitCount: 1 },
        ],
      }),
    );
    expect(singleVisit.some((s) => s.includes("visualizou"))).toBe(false);
  });

  it("reports the average comparison price spread only when positive", () => {
    const withSpread = generatePersonalInsights(
      baseInput({ comparisonSpreads: [{ spreadCents: 2000 }, { spreadCents: 4000 }] }),
    );
    expect(withSpread.some((s) => s.includes("diferença entre o produto mais caro"))).toBe(true);

    const zeroSpread = generatePersonalInsights(
      baseInput({ comparisonSpreads: [{ spreadCents: 0 }] }),
    );
    expect(zeroSpread.some((s) => s.includes("diferença entre o produto mais caro"))).toBe(false);
  });

  it("reports the favorites count only when greater than zero", () => {
    expect(generatePersonalInsights(baseInput({ favoritesCount: 3 }))).toContain(
      "Você tem 3 produtos favoritados.",
    );
    expect(
      generatePersonalInsights(baseInput({ favoritesCount: 0 })).some((s) =>
        s.includes("favoritado"),
      ),
    ).toBe(false);
  });
});
