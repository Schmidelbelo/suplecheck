import { InvalidMethodologyVersionError } from "../errors/DomainError";

/**
 * Versão semântica de uma metodologia (MAJOR.MINOR.PATCH). Cada
 * recálculo do Índice referencia a versão da metodologia usada — nunca a
 * "metodologia atual" implicitamente — para que resultados antigos
 * continuem explicáveis mesmo depois de a fórmula evoluir
 * (ver ARCHITECTURE.md §8, versionamento do ProductScore).
 */
export class MethodologyVersion {
  private static readonly PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

  private constructor(
    private readonly major: number,
    private readonly minor: number,
    private readonly patch: number,
  ) {}

  static of(value: string): MethodologyVersion {
    const match = MethodologyVersion.PATTERN.exec(value);
    if (!match) {
      throw new InvalidMethodologyVersionError(value);
    }
    return new MethodologyVersion(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  static initial(): MethodologyVersion {
    return new MethodologyVersion(1, 0, 0);
  }

  nextMajor(): MethodologyVersion {
    return new MethodologyVersion(this.major + 1, 0, 0);
  }

  nextMinor(): MethodologyVersion {
    return new MethodologyVersion(this.major, this.minor + 1, 0);
  }

  nextPatch(): MethodologyVersion {
    return new MethodologyVersion(this.major, this.minor, this.patch + 1);
  }

  isNewerThan(other: MethodologyVersion): boolean {
    if (this.major !== other.major) return this.major > other.major;
    if (this.minor !== other.minor) return this.minor > other.minor;
    return this.patch > other.patch;
  }

  equals(other: MethodologyVersion): boolean {
    return this.major === other.major && this.minor === other.minor && this.patch === other.patch;
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}
