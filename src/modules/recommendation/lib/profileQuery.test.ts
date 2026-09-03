import { describe, expect, it } from "vitest";
import {
  encodeProfileToSearchParams,
  decodeProfileFromSearchParams,
  isProfileComplete,
  DEFAULT_PROFILE,
  type RecommendationProfileForm,
} from "./profileQuery";

describe("encodeProfileToSearchParams / decodeProfileFromSearchParams", () => {
  it("round-trips a fully filled profile through the URL", () => {
    const profile: RecommendationProfileForm = {
      goal: "ganho-de-massa",
      priority: "economy",
      budgetCents: 15000,
      age: 28,
      sex: "masculino",
      trainingLevel: "intermediario",
      weeklyFrequency: 4,
    };

    const params = encodeProfileToSearchParams(profile);
    const decoded = decodeProfileFromSearchParams(params);

    expect(decoded).toEqual(profile);
  });

  it("produces a URL that only includes fields actually filled in", () => {
    const params = encodeProfileToSearchParams(DEFAULT_PROFILE);
    expect(params.has("goal")).toBe(false);
    expect(params.has("budget")).toBe(false);
    expect(params.get("priority")).toBe("costBenefit");
  });

  it("falls back to defaults for an invalid priority instead of throwing", () => {
    const params = new URLSearchParams({ priority: "not-a-real-priority" });
    const decoded = decodeProfileFromSearchParams(params);
    expect(decoded.priority).toBe(DEFAULT_PROFILE.priority);
  });

  it("ignores an invalid training level and sex instead of throwing", () => {
    const params = new URLSearchParams({ level: "expert", sex: "outro" });
    const decoded = decodeProfileFromSearchParams(params);
    expect(decoded.trainingLevel).toBeNull();
    expect(decoded.sex).toBeNull();
  });

  it("rounds a fractional budget query value to whole reais", () => {
    const params = new URLSearchParams({ budget: "149.9" });
    const decoded = decodeProfileFromSearchParams(params);
    expect(decoded.budgetCents).toBe(15000);
  });

  it("treats a negative or zero budget as absent", () => {
    expect(
      decodeProfileFromSearchParams(new URLSearchParams({ budget: "0" })).budgetCents,
    ).toBeNull();
    expect(
      decodeProfileFromSearchParams(new URLSearchParams({ budget: "-10" })).budgetCents,
    ).toBeNull();
  });

  it("decodes from a plain query-object shape (e.g. Next.js searchParams)", () => {
    const decoded = decodeProfileFromSearchParams({ goal: "performance", priority: "quality" });
    expect(decoded.goal).toBe("performance");
    expect(decoded.priority).toBe("quality");
  });
});

describe("isProfileComplete", () => {
  it("is complete once a goal is chosen (priority always has a default)", () => {
    expect(isProfileComplete({ ...DEFAULT_PROFILE, goal: "ganho-de-massa" })).toBe(true);
  });

  it("is incomplete without a goal", () => {
    expect(isProfileComplete(DEFAULT_PROFILE)).toBe(false);
  });
});
