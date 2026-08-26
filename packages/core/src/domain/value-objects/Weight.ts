import { InvalidWeightError } from "../errors/DomainError";

/**
 * Peso relativo de um critério dentro de uma metodologia, como fração
 * 0–1 (0.35 = 35%). Value Object separado de `number` para que "peso"
 * nunca seja confundido com "nota" (Score) na assinatura de uma função.
 */
export class Weight {
  private constructor(private readonly raw: number) {}

  static of(value: number): Weight {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new InvalidWeightError(value);
    }
    return new Weight(value);
  }

  static fromPercentage(percentage: number): Weight {
    return Weight.of(percentage / 100);
  }

  static zero(): Weight {
    return new Weight(0);
  }

  get value(): number {
    return this.raw;
  }

  toPercentage(): number {
    return this.raw * 100;
  }

  scale(factor: number): Weight {
    return Weight.of(this.raw * factor);
  }

  isZero(): boolean {
    return this.raw === 0;
  }
}
