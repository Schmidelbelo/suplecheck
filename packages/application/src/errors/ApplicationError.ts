/**
 * Base de todo erro da Application Layer. Um `DomainError` (lançado pelo
 * Core) nunca deve escapar desta camada sem passar por um Use Case, que
 * o traduz para um `ApplicationError` — quem está fora desta camada
 * (Infrastructure/Presentation) só precisa conhecer este vocabulário,
 * nunca o do Domain.
 */
export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    /** Erro de origem (ex: um DomainError), preservado para log/depuração. */
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationFailedError extends ApplicationError {
  readonly code = "VALIDATION_FAILED";
  constructor(public readonly issues: readonly string[]) {
    super(`Falha de validação: ${issues.join("; ")}`);
  }
}

export class SupplementNotFoundError extends ApplicationError {
  readonly code = "SUPPLEMENT_NOT_FOUND";
  constructor(id: string) {
    super(`Suplemento "${id}" não encontrado.`);
  }
}

export class DuplicateSupplementSlugError extends ApplicationError {
  readonly code = "DUPLICATE_SUPPLEMENT_SLUG";
  constructor(slug: string) {
    super(`Já existe um suplemento com o slug "${slug}".`);
  }
}

export class CategoryNotFoundError extends ApplicationError {
  readonly code = "CATEGORY_NOT_FOUND";
  constructor(slug: string) {
    super(`Categoria "${slug}" não encontrada.`);
  }
}

export class BrandNotFoundError extends ApplicationError {
  readonly code = "BRAND_NOT_FOUND";
  constructor(slug: string) {
    super(`Marca "${slug}" não encontrada.`);
  }
}

export class ManufacturerNotFoundError extends ApplicationError {
  readonly code = "MANUFACTURER_NOT_FOUND";
  constructor(slug: string) {
    super(`Fabricante "${slug}" não encontrado.`);
  }
}

export class SkuNotFoundError extends ApplicationError {
  readonly code = "SKU_NOT_FOUND";
  constructor(id: string) {
    super(`SKU "${id}" não encontrado.`);
  }
}

export class DuplicateSlugError extends ApplicationError {
  readonly code = "DUPLICATE_SLUG";
  constructor(entity: string, slug: string) {
    super(`Já existe ${entity} com o slug "${slug}".`);
  }
}

export class DuplicateSkuGtinError extends ApplicationError {
  readonly code = "DUPLICATE_SKU_GTIN";
  constructor(gtin: string) {
    super(`Já existe um SKU com o GTIN "${gtin}".`);
  }
}

export class MethodologyNotFoundError extends ApplicationError {
  readonly code = "METHODOLOGY_NOT_FOUND";
  constructor(id: string) {
    super(`Metodologia "${id}" não encontrada.`);
  }
}

export class CriterionNotFoundError extends ApplicationError {
  readonly code = "CRITERION_NOT_FOUND";
  constructor(id: string) {
    super(`Critério "${id}" não encontrado.`);
  }
}

export class IndexResultNotFoundError extends ApplicationError {
  readonly code = "INDEX_RESULT_NOT_FOUND";
  constructor(supplementId: string) {
    super(`Nenhum Índice SupleCheck calculado ainda para o suplemento "${supplementId}".`);
  }
}

export class PolicyViolationError extends ApplicationError {
  readonly code = "POLICY_VIOLATION";
  constructor(policyName: string, reason: string) {
    super(`Política "${policyName}" violada: ${reason}`);
  }
}

/** Erro esperado para Use Cases que hoje são só esqueleto (ver ARCHITECTURE.md). */
export class NotImplementedYetError extends ApplicationError {
  readonly code = "NOT_IMPLEMENTED_YET";
  constructor(operation: string) {
    super(
      `"${operation}" ainda não está implementado — o caso de uso existe como esqueleto, aguardando a camada de Infrastructure correspondente.`,
    );
  }
}

/** Um Port não foi fornecido a um Use Case que precisa dele em tempo de execução. */
export class MissingPortError extends ApplicationError {
  readonly code = "MISSING_PORT";
  constructor(portName: string, useCaseName: string) {
    super(`"${useCaseName}" foi construído sem o Port obrigatório "${portName}".`);
  }
}
