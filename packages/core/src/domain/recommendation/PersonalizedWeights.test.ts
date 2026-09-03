import { describe, expect, it } from "vitest";
import {
  resolvePersonalizedWeights,
  PERSONALIZED_WEIGHTS_BY_PRIORITY,
} from "./PersonalizedWeights";

describe("resolvePersonalizedWeights", () => {
  it("gives more weight to price signals for the economy priority than for quality", () => {
    const economy = resolvePersonalizedWeights("economy");
    const quality = resolvePersonalizedWeights("quality");

    expect(economy.price + economy.pricePerDose + economy.pricePerGram).toBeGreaterThan(
      quality.price + quality.pricePerDose + quality.pricePerGram,
    );
    expect(quality.quality).toBeGreaterThan(economy.quality);
  });

  it("gives transparency priority the highest transparency weight of all profiles", () => {
    const transparencyWeights = resolvePersonalizedWeights("transparency").transparency;
    for (const priority of Object.keys(
      PERSONALIZED_WEIGHTS_BY_PRIORITY,
    ) as (keyof typeof PERSONALIZED_WEIGHTS_BY_PRIORITY)[]) {
      if (priority === "transparency") continue;
      expect(transparencyWeights).toBeGreaterThan(
        PERSONALIZED_WEIGHTS_BY_PRIORITY[priority].transparency,
      );
    }
  });

  it("gives bestRating the highest quality weight of all profiles", () => {
    const bestRatingQuality = resolvePersonalizedWeights("bestRating").quality;
    for (const priority of Object.keys(
      PERSONALIZED_WEIGHTS_BY_PRIORITY,
    ) as (keyof typeof PERSONALIZED_WEIGHTS_BY_PRIORITY)[]) {
      if (priority === "bestRating") continue;
      expect(bestRatingQuality).toBeGreaterThan(PERSONALIZED_WEIGHTS_BY_PRIORITY[priority].quality);
    }
  });

  it("has all weight components strictly positive for every priority profile", () => {
    for (const weights of Object.values(PERSONALIZED_WEIGHTS_BY_PRIORITY)) {
      expect(weights.quality).toBeGreaterThan(0);
      expect(weights.price).toBeGreaterThan(0);
      expect(weights.pricePerDose).toBeGreaterThan(0);
      expect(weights.pricePerGram).toBeGreaterThan(0);
      expect(weights.transparency).toBeGreaterThan(0);
    }
  });
});
