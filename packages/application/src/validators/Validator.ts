import { ok, err, type Result } from "../domain-kernel";

export interface ValidationIssue {
  readonly field: string;
  readonly message: string;
}

export type ValidationResult = Result<true, ValidationIssue[]>;

/**
 * Contrato de um validador de Application Layer. Diferente da validação
 * de invariante do Domain (que rejeita construir um objeto inválido),
 * um Validator daqui checa a *forma* de um Command/Query antes de
 * sequer tentar montar algo do Domain — permite acumular vários
 * problemas de uma vez (útil para formulário), em vez de parar no
 * primeiro erro.
 */
export interface ApplicationValidator<T> {
  validate(input: T): ValidationResult;
}

export class ValidationIssueCollector {
  private readonly issues: ValidationIssue[] = [];

  require(condition: boolean, field: string, message: string): void {
    if (!condition) this.issues.push({ field, message });
  }

  toResult(): ValidationResult {
    return this.issues.length === 0 ? ok(true) : err(this.issues);
  }
}
