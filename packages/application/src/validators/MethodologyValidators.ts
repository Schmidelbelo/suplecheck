import type { ApplicationValidator, ValidationResult } from "./Validator";
import { ValidationIssueCollector } from "./Validator";
import type { CreateMethodologyCommand } from "../commands/MethodologyCommands";

const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Valida a *forma* do comando antes de chegar em `MethodologyBuilder`
 * (que valida a *soma* dos pesos — invariante de Domain). As duas
 * checagens são complementares, não redundantes: esta pega "esqueci de
 * incluir critérios" antes de "os pesos não somam 1" confundir a causa
 * real do erro.
 */
export class CreateMethodologyValidator implements ApplicationValidator<CreateMethodologyCommand> {
  validate(input: CreateMethodologyCommand): ValidationResult {
    const c = new ValidationIssueCollector();
    c.require(ID_PATTERN.test(input.id), "id", "deve estar em kebab-case (ex: creatina-v1)");
    c.require(input.name.trim().length >= 2, "name", "deve ter ao menos 2 caracteres");
    c.require(input.criteria.length > 0, "criteria", "ao menos um critério deve ser informado");

    const ids = new Set<string>();
    for (const criterion of input.criteria) {
      if (ids.has(criterion.criterionId)) {
        c.require(false, "criteria", `critério "${criterion.criterionId}" duplicado no comando`);
      }
      ids.add(criterion.criterionId);
    }

    return c.toResult();
  }
}
