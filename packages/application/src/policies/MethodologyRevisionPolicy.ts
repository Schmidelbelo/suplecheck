import type { Methodology } from "../domain-kernel";
import { PolicyViolationError } from "../errors/ApplicationError";

/**
 * Impede uma "revisão" que não revisa nada — bump de versão sem nenhuma
 * mudança real de critério/peso só polui o histórico e confunde quem lê
 * `MethodologyVersion` depois tentando entender o que mudou entre 1.0.0
 * e 1.1.0.
 */
export class MethodologyRevisionPolicy {
  assertRevisionIsMeaningful(current: Methodology, revised: Methodology): void {
    const sameLength = current.assignments.length === revised.assignments.length;
    const sameAssignments =
      sameLength &&
      current.assignments.every((assignment) => {
        const match = revised.assignments.find((r) => r.criterionId.equals(assignment.criterionId));
        return (
          match !== undefined &&
          match.enabled === assignment.enabled &&
          Math.abs(match.weight.value - assignment.weight.value) < 1e-9
        );
      });

    if (sameAssignments) {
      throw new PolicyViolationError(
        "MethodologyRevisionPolicy",
        `a revisão de "${current.id}" não altera nenhum critério ou peso — nada para versionar.`,
      );
    }
  }
}
