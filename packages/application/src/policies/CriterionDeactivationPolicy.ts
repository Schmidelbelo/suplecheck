import { CriterionId, type Methodology } from "../domain-kernel";
import { PolicyViolationError } from "../errors/ApplicationError";

/**
 * Impede desativar um critério se isso deixaria alguma metodologia sem
 * nenhum critério ativo (o Domain já rejeita isso no momento do
 * cálculo — `NoActiveCriteriaError` — mas essa política avisa
 * *antecipadamente*, no momento da desativação, antes de qualquer
 * cálculo ser tentado e falhar em produção).
 *
 * Simplificação deliberada: considera só os `assignments` base de cada
 * metodologia, não os `CategoryOverride` — overrides por categoria têm
 * granularidade própria e podem exigir uma checagem por categoria no
 * futuro (ver ARCHITECTURE.md §6, limitações conhecidas).
 */
export class CriterionDeactivationPolicy {
  assertCanDeactivate(criterionId: string, methodologiesUsingIt: readonly Methodology[]): void {
    const target = CriterionId.of(criterionId);

    for (const methodology of methodologiesUsingIt) {
      const remainingActive = methodology.assignments.filter(
        (assignment) => assignment.enabled && !assignment.criterionId.equals(target),
      );
      if (remainingActive.length === 0) {
        throw new PolicyViolationError(
          "CriterionDeactivationPolicy",
          `desativar "${criterionId}" deixaria a metodologia "${methodology.id}" sem nenhum critério ativo.`,
        );
      }
    }
  }
}
