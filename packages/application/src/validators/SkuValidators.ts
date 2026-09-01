import type { ApplicationValidator, ValidationResult } from "./Validator";
import { ValidationIssueCollector } from "./Validator";
import type { CreateSkuCommand } from "../commands/SkuCommands";

export class CreateSkuValidator implements ApplicationValidator<CreateSkuCommand> {
  validate(input: CreateSkuCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(input.productId.trim().length > 0, "productId", "é obrigatório");
    c.require(
      input.variantLabel.trim().length >= 2,
      "variantLabel",
      "deve ter ao menos 2 caracteres",
    );
    c.require(
      input.servingsPerUnit === undefined || input.servingsPerUnit > 0,
      "servingsPerUnit",
      "deve ser positivo quando informado",
    );
    return c.toResult();
  }
}
