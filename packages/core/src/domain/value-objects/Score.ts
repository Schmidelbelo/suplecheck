import { InvalidScoreError } from "../errors/DomainError";

const MIN = 0;
const MAX = 100;

/**
 * Nota em uma escala fixa de 0 a 100 — usada tanto para o resultado de um
 * critério individual quanto para o Índice SupleScore final. Fixar a
 * escala aqui (em vez de deixar cada critério inventar a sua) é o que
 * permite comparar/agregar notas de critérios diferentes sem conversão.
 */
export class Score {
  private constructor(private readonly raw: number) {}

  static of(value: number): Score {
    if (!Number.isFinite(value) || value < MIN || value > MAX) {
      throw new InvalidScoreError(value);
    }
    return new Score(value);
  }

  /** Constrói uma Score a partir de uma fração 0–1 (ex: taxa de acerto). */
  static fromRatio(ratio: number): Score {
    const clamped = Math.min(1, Math.max(0, ratio));
    return new Score(clamped * MAX);
  }

  static min(): Score {
    return new Score(MIN);
  }

  static max(): Score {
    return new Score(MAX);
  }

  get value(): number {
    return this.raw;
  }

  toRatio(): number {
    return this.raw / MAX;
  }

  equals(other: Score): boolean {
    return Math.abs(this.raw - other.raw) < 1e-9;
  }

  isAtLeast(other: Score): boolean {
    return this.raw >= other.raw;
  }

  toString(): string {
    return this.raw.toFixed(1);
  }
}
