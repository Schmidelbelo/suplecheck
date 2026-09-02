import type { ApplicationValidator, ValidationResult } from "./Validator";
import { ValidationIssueCollector } from "./Validator";
import type {
  CreateCategoryCommand,
  CreateBrandCommand,
  CreateManufacturerCommand,
} from "../commands/CatalogCommands";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Valida `name` em um Update Command — `undefined` significa "não
 * alterar" (válido), mas um valor presente precisa respeitar a mesma
 * regra de mínimo aplicada na criação (`Create*Validator` acima). Sem
 * isto, `PATCH { "name": "" }` passava direto e sobrescrevia o nome
 * existente com string vazia.
 */
export function validateOptionalName(name: string | undefined): ValidationResult {
  const c = new ValidationIssueCollector();
  if (name !== undefined) {
    c.require(name.trim().length >= 2, "name", "deve ter ao menos 2 caracteres");
  }
  return c.toResult();
}

export class CreateCategoryValidator implements ApplicationValidator<CreateCategoryCommand> {
  validate(input: CreateCategoryCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(SLUG_PATTERN.test(input.slug), "slug", "deve estar em kebab-case");
    c.require(input.name.trim().length >= 2, "name", "deve ter ao menos 2 caracteres");
    return c.toResult();
  }
}

export class CreateBrandValidator implements ApplicationValidator<CreateBrandCommand> {
  validate(input: CreateBrandCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(SLUG_PATTERN.test(input.slug), "slug", "deve estar em kebab-case");
    c.require(input.name.trim().length >= 2, "name", "deve ter ao menos 2 caracteres");
    return c.toResult();
  }
}

export class CreateManufacturerValidator implements ApplicationValidator<CreateManufacturerCommand> {
  validate(input: CreateManufacturerCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(SLUG_PATTERN.test(input.slug), "slug", "deve estar em kebab-case");
    c.require(input.name.trim().length >= 2, "name", "deve ter ao menos 2 caracteres");
    return c.toResult();
  }
}
