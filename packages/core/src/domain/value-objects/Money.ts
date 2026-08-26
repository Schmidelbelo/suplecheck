/**
 * Valor monetário em centavos (evita erro de ponto flutuante em preço).
 * Moeda fixa em BRL nesta etapa — generalizar para multi-moeda é uma
 * extensão futura que não deve exigir tocar nos critérios existentes.
 */
export class Money {
  private constructor(private readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isFinite(cents) || cents < 0) {
      throw new Error(`Valor monetário inválido: ${cents} centavos.`);
    }
    return new Money(Math.round(cents));
  }

  static fromReais(reais: number): Money {
    return Money.fromCents(reais * 100);
  }

  static zero(): Money {
    return new Money(0);
  }

  get valueInCents(): number {
    return this.cents;
  }

  toReais(): number {
    return this.cents / 100;
  }

  /** Preço por unidade de dose — a base do critério "preço por dose". */
  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error("Divisor de Money deve ser positivo.");
    }
    return Money.fromCents(this.cents / divisor);
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }
}
