/**
 * Identidade estável de um critério (ex: "cost-benefit"). Usar um VO em
 * vez de `string` crua evita que qualquer string solta seja aceita onde
 * um id de critério é esperado, e centraliza a regra de formato.
 */
export class CriterionId {
  private static readonly PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  private constructor(private readonly raw: string) {}

  static of(value: string): CriterionId {
    if (!CriterionId.PATTERN.test(value)) {
      throw new Error(`Id de critério inválido: "${value}". Use kebab-case (ex: "cost-benefit").`);
    }
    return new CriterionId(value);
  }

  get value(): string {
    return this.raw;
  }

  equals(other: CriterionId): boolean {
    return this.raw === other.raw;
  }

  toString(): string {
    return this.raw;
  }
}
