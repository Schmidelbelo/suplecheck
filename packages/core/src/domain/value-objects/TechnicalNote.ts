import { EvidenceQuality, ValidationSeverity } from "../enums/EvidenceQuality";

/**
 * Observação técnica anexada a um resultado de critério — explica o
 * "porquê" de uma nota para quem audita o cálculo (ex: "dosagem 15%
 * abaixo da faixa de referência"). Puramente informativa: nunca altera
 * a nota, apenas documenta o raciocínio por trás dela.
 */
export class TechnicalNote {
  private constructor(
    public readonly message: string,
    public readonly evidenceQuality: EvidenceQuality,
  ) {}

  static of(
    message: string,
    evidenceQuality: EvidenceQuality = EvidenceQuality.HIGH,
  ): TechnicalNote {
    if (!message.trim()) {
      throw new Error("Observação técnica não pode ser vazia.");
    }
    return new TechnicalNote(message, evidenceQuality);
  }
}

/**
 * Sinalização de que algo no dado de entrada merece atenção (dado
 * ausente, valor fora do esperado, evidência insuficiente). Diferente de
 * uma exceção: o cálculo continua, mas o resultado carrega o alerta.
 */
export class ValidationFlag {
  private constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly severity: ValidationSeverity,
  ) {}

  static of(
    code: string,
    message: string,
    severity: ValidationSeverity = ValidationSeverity.WARNING,
  ): ValidationFlag {
    return new ValidationFlag(code, message, severity);
  }

  isCritical(): boolean {
    return this.severity === ValidationSeverity.CRITICAL;
  }
}
