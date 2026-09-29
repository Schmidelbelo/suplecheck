import { describe, expect, it } from "vitest";
import { outboundDestinationType } from "./outboundDestination";

describe("outboundDestinationType", () => {
  it("maps the Amazon and Mercado Livre stores", () => {
    expect(outboundDestinationType("amazon-br")).toBe("amazon");
    expect(outboundDestinationType("mercado-livre")).toBe("mercado_livre");
  });

  it("falls back to other for any other or missing store", () => {
    expect(outboundDestinationType("dux-oficial")).toBe("other");
    expect(outboundDestinationType(null)).toBe("other");
    expect(outboundDestinationType(undefined)).toBe("other");
    expect(outboundDestinationType("")).toBe("other");
  });
});
