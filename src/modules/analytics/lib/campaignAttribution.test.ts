import { describe, expect, it } from "vitest";
import {
  extractCampaignAttribution,
  parseStoredAttribution,
  utmEventParams,
} from "./campaignAttribution";

describe("extractCampaignAttribution", () => {
  it("keeps only UTM keys and gclid", () => {
    expect(
      extractCampaignAttribution(
        "?utm_source=google&utm_medium=cpc&utm_campaign=ss_creatina&gclid=abc&foo=bar&position=2",
      ),
    ).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "ss_creatina",
      gclid: "abc",
    });
  });

  it("returns null when there is no campaign parameter", () => {
    expect(extractCampaignAttribution("?source=product-page")).toBeNull();
    expect(extractCampaignAttribution("")).toBeNull();
  });

  it("ignores empty values and truncates very long ones", () => {
    const long = "x".repeat(500);
    expect(extractCampaignAttribution(`?utm_source=&utm_term=${long}`)).toEqual({
      utm_term: "x".repeat(200),
    });
  });
});

describe("parseStoredAttribution", () => {
  it("round-trips a stored attribution", () => {
    expect(parseStoredAttribution('{"utm_source":"google","gclid":"abc"}')).toEqual({
      utm_source: "google",
      gclid: "abc",
    });
  });

  it("drops unknown keys and non-string values", () => {
    expect(parseStoredAttribution('{"utm_source":"google","email":"a@b.c","utm_term":42}')).toEqual(
      { utm_source: "google" },
    );
  });

  it("returns null for missing or malformed values", () => {
    expect(parseStoredAttribution(null)).toBeNull();
    expect(parseStoredAttribution("not json")).toBeNull();
    expect(parseStoredAttribution("[]")).toBeNull();
    expect(parseStoredAttribution("{}")).toBeNull();
  });
});

describe("utmEventParams", () => {
  it("never forwards gclid as an event parameter", () => {
    expect(utmEventParams({ utm_source: "google", utm_campaign: "x", gclid: "abc" })).toEqual({
      utm_source: "google",
      utm_campaign: "x",
    });
  });

  it("returns an empty object without attribution", () => {
    expect(utmEventParams(null)).toEqual({});
  });
});
