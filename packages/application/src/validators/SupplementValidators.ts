import type { ApplicationValidator, ValidationResult } from "./Validator";
import { ValidationIssueCollector } from "./Validator";
import type {
  RegisterSupplementCommand,
  EvaluateSupplementCommand,
} from "../commands/SupplementCommands";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class RegisterSupplementValidator implements ApplicationValidator<RegisterSupplementCommand> {
  validate(input: RegisterSupplementCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(
      SLUG_PATTERN.test(input.slug),
      "slug",
      "deve estar em kebab-case (ex: creatina-monohidratada-x)",
    );
    c.require(input.name.trim().length >= 2, "name", "deve ter ao menos 2 caracteres");
    c.require(input.categorySlug.trim().length > 0, "categorySlug", "é obrigatório");
    c.require(input.brandSlug.trim().length > 0, "brandSlug", "é obrigatório");
    return c.toResult();
  }
}

export class EvaluateSupplementValidator implements ApplicationValidator<EvaluateSupplementCommand> {
  validate(input: EvaluateSupplementCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(input.supplementId.trim().length > 0, "supplementId", "é obrigatório");
    const hasAnyFact = Object.values(input.facts).some((fact) => fact !== undefined);
    c.require(hasAnyFact, "facts", "ao menos um grupo de fatos deve ser informado");
    return c.toResult();
  }
}
