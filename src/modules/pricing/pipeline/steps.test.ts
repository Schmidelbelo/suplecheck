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
      validateCapturedPrice({ priceCents: 4990, availability: "UNKNOWN", url: null }, 4990),
    ).not.toThrow();
  });

  it("rejeita preço zero ou negativo", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 0, availability: "UNKNOWN", url: null }, null),
    ).toThrow(InvalidPriceCaptureError);
    expect(() =>
      validateCapturedPrice({ priceCents: -100, availability: "UNKNOWN", url: null }, null),
    ).toThrow(InvalidPriceCaptureError);
  });

  it("rejeita variação implausível (mais de 5x para cima ou para baixo)", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 100_000, availability: "UNKNOWN", url: null }, 1000),
    ).toThrow(InvalidPriceCaptureError);
    expect(() =>
      validateCapturedPrice({ priceCents: 100, availability: "UNKNOWN", url: null }, 10_000),
    ).toThrow(InvalidPriceCaptureError);
  });

  it("aceita a primeira captura (sem preço anterior para comparar)", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 4990, availability: "UNKNOWN", url: null }, null),
    ).not.toThrow();
  });

  it("aceita uma URL absoluta válida", () => {
    expect(() =>
      validateCapturedPrice(
        { priceCents: 4990, availability: "UNKNOWN", url: "https://loja.example/produto" },
        4990,
      ),
    ).not.toThrow();
  });

  it("aceita url null — captura sem URL conhecida nunca é rejeitada por isso", () => {
    expect(() =>
      validateCapturedPrice({ priceCents: 4990, availability: "UNKNOWN", url: null }, 4990),
    ).not.toThrow();
  });

  it("rejeita uma URL malformada", () => {
    expect(() =>
      validateCapturedPrice(
        { priceCents: 4990, availability: "UNKNOWN", url: "não é uma url" },
        4990,
      ),
    ).toThrow(InvalidPriceCaptureError);
  });
});

describe("normalizeCapturedPrice", () => {
  it("arredonda para inteiro", () => {
    expect(
      normalizeCapturedPrice({ priceCents: 4990.6, availability: "IN_STOCK", url: null })
        .priceCents,
    ).toBe(4991);
  });

  it("preserva a URL capturada", () => {
    expect(
      normalizeCapturedPrice({
        priceCents: 4990,
        availability: "IN_STOCK",
        url: "https://loja.example/produto",
      }).url,
    ).toBe("https://loja.example/produto");
  });

  it("apara espaços da URL", () => {
    expect(
      normalizeCapturedPrice({
        priceCents: 4990,
        availability: "IN_STOCK",
        url: "  https://loja.example/produto  ",
      }).url,
    ).toBe("https://loja.example/produto");
  });

  it("trata URL vazia ou só espaço como null — nunca persiste uma URL quase-vazia", () => {
    expect(
      normalizeCapturedPrice({ priceCents: 4990, availability: "IN_STOCK", url: "" }).url,
    ).toBe(null);
    expect(
      normalizeCapturedPrice({ priceCents: 4990, availability: "IN_STOCK", url: "   " }).url,
    ).toBe(null);
  });

  it("preserva url null", () => {
    expect(
      normalizeCapturedPrice({ priceCents: 4990, availability: "IN_STOCK", url: null }).url,
    ).toBe(null);
  });
});

describe("comparePrice", () => {
  it("identifica primeira captura", () => {
    expect(comparePrice({ priceCents: 4990, availability: "UNKNOWN", url: null }, null)).toBe(
      "first_capture",
    );
  });

  it("identifica preço inalterado", () => {
    expect(comparePrice({ priceCents: 4990, availability: "UNKNOWN", url: null }, 4990)).toBe(
      "unchanged",
    );
  });

  it("identifica queda", () => {
    expect(comparePrice({ priceCents: 3990, availability: "UNKNOWN", url: null }, 4990)).toBe(
      "decreased",
    );
  });

  it("identifica aumento", () => {
    expect(comparePrice({ priceCents: 5990, availability: "UNKNOWN", url: null }, 4990)).toBe(
      "increased",
    );
  });
});
