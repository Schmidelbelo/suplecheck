import { describe, expect, it } from "vitest";
import {
  encodeComparisonSlug,
  decodeComparisonSlug,
  isCanonicalComparisonSlug,
} from "./comparisonSlug";

describe("encodeComparisonSlug", () => {
  it("always orders the two slugs alphabetically", () => {
    expect(encodeComparisonSlug("zulu-produto", "alfa-produto")).toBe("alfa-produto-vs-zulu-produto");
    expect(encodeComparisonSlug("alfa-produto", "zulu-produto")).toBe("alfa-produto-vs-zulu-produto");
  });
});

describe("decodeComparisonSlug", () => {
  const knownSlugs = ["growth-creatina-300g", "dux-creatina-300g", "probiotica-creatina-300g"];

  it("decodes a canonical pair into its two real slugs", () => {
    const pair = encodeComparisonSlug("growth-creatina-300g", "dux-creatina-300g");
    expect(decodeComparisonSlug(pair, knownSlugs)).toEqual(["dux-creatina-300g", "growth-creatina-300g"]);
  });

  it("returns null when one side is not a known slug", () => {
    const pair = "growth-creatina-300g-vs-produto-inexistente";
    expect(decodeComparisonSlug(pair, knownSlugs)).toBeNull();
  });

  it("returns null when there is no -vs- separator at all", () => {
    expect(decodeComparisonSlug("growth-creatina-300g", knownSlugs)).toBeNull();
  });

  it("returns null when both halves resolve to the same product", () => {
    const pair = "growth-creatina-300g-vs-growth-creatina-300g";
    expect(decodeComparisonSlug(pair, knownSlugs)).toBeNull();
  });

  it("finds the correct split even if a slug itself contains a hyphenated word before -vs-", () => {
    const trickySlugs = ["produto-vs-especial", "outro-produto"];
    const pair = encodeComparisonSlug("produto-vs-especial", "outro-produto");
    expect(decodeComparisonSlug(pair, trickySlugs)).toEqual(["outro-produto", "produto-vs-especial"]);
  });
});

describe("isCanonicalComparisonSlug", () => {
  it("is true only for the alphabetically ordered pair", () => {
    expect(isCanonicalComparisonSlug("a-vs-b", "a", "b")).toBe(true);
    expect(isCanonicalComparisonSlug("b-vs-a", "a", "b")).toBe(false);
  });
});
