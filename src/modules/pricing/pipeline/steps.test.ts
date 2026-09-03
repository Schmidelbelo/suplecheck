import { describe, it, expect } from "vitest";
import {
  validateCapturedPrice,
  normalizeCapturedPrice,
  comparePrice,
  InvalidPriceCaptureError,
} from "./steps";

describe("validateCapturedPrice", () => {
  it("aceita um preço positivo plausível", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 4990, availability: "UNKNOWN" }, 4990),
    ).not.toThrow();
  });

  it("rejeita preço zero ou negativo", () => {
    expect(() => validateCapturedPrice({ priceCents: 0, availability: "UNKNOWN" }, null)).toThrow(
      InvalidPriceCaptureError,
    );
    expect(() =>
      validateCapturedPrice({ priceCents: -100, availability: "UNKNOWN" }, null),
    ).toThrow(InvalidPriceCaptureError);
  });

  it("rejeita variação implausível (mais de 5x para cima ou para baixo)", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 100_000, availability: "UNKNOWN" }, 1000),
    ).toThrow(InvalidPriceCaptureError);
    expect(() =>
      validateCapturedPrice({ priceCents: 100, availability: "UNKNOWN" }, 10_000),
    ).toThrow(InvalidPriceCaptureError);
  });

  it("aceita a primeira captura (sem preço anterior para comparar)", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 4990, availability: "UNKNOWN" }, null),
    ).not.toThrow();
  });
});

describe("normalizeCapturedPrice", () => {
  it("arredonda para inteiro", () => {
    expect(
      normalizeCapturedPrice({ priceCents: 4990.6, availability: "IN_STOCK" }).priceCents,
    ).toBe(4991);
  });
});

describe("comparePrice", () => {
  it("identifica primeira captura", () => {
    expect(comparePrice({ priceCents: 4990, availability: "UNKNOWN" }, null)).toBe("first_capture");
  });

  it("identifica preço inalterado", () => {
    expect(comparePrice({ priceCents: 4990, availability: "UNKNOWN" }, 4990)).toBe("unchanged");
  });

  it("identifica queda", () => {
    expect(comparePrice({ priceCents: 3990, availability: "UNKNOWN" }, 4990)).toBe("decreased");
  });

  it("identifica aumento", () => {
    expect(comparePrice({ priceCents: 5990, availability: "UNKNOWN" }, 4990)).toBe("increased");
  });
});
