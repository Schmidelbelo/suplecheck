/**
 * Base de todos os erros de domínio do Core Domain. Nunca lançado
 * diretamente — sempre via uma subclasse nomeada, para que quem captura
 * o erro saiba exatamente qual invariante foi violada.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidScoreError extends DomainError {
  readonly code = "INVALID_SCORE";
  constructor(value: number) {
    super(`Score inválido: ${value}. Deve estar entre 0 e 100.`);
  }
}

export class InvalidWeightError extends DomainError {
  readonly code = "INVALID_WEIGHT";
  constructor(value: number) {
    super(`Peso inválido: ${value}. Deve estar entre 0 e 1.`);
  }
}

export class WeightSumMismatchError extends DomainError {
  readonly code = "WEIGHT_SUM_MISMATCH";
  constructor(sum: number, context: string) {
    super(
      `A soma dos pesos em ${context} é ${sum.toFixed(4)}, mas deveria ser 1 (100%). ` +
        "Ajuste os pesos ou use MethodologyBuilder.normalizeWeights().",
    );
  }
}

export class DuplicateCriterionError extends DomainError {
  readonly code = "DUPLICATE_CRITERION";
  constructor(criterionId: string) {
    super(`O critério "${criterionId}" já está registrado.`);
  }
}

export class UnknownCriterionError extends DomainError {
  readonly code = "UNKNOWN_CRITERION";
  constructor(criterionId: string) {
    super(`Nenhum critério registrado com o id "${criterionId}".`);
  }
}

export class NoActiveCriteriaError extends DomainError {
  readonly code = "NO_ACTIVE_CRITERIA";
  constructor(context: string) {
    super(`Nenhum critério ativo disponível para avaliar (${context}).`);
  }
}

export class InvalidMethodologyVersionError extends DomainError {
  readonly code = "INVALID_METHODOLOGY_VERSION";
  constructor(value: string) {
    super(`Versão de metodologia inválida: "${value}". Use o formato semântico MAJOR.MINOR.PATCH.`);
  }
}

export class MissingEvaluationDataError extends DomainError {
  readonly code = "MISSING_EVALUATION_DATA";
  constructor(criterionId: string, missingFact: string) {
    super(`O critério "${criterionId}" requer o dado "${missingFact}", que não foi fornecido.`);
  }
}
