import type { AllUseCases } from "../factories/UseCaseFactory";
import type {
  CreateMethodologyCommand,
  ReviseMethodologyCommand,
  RegisterCriterionCommand,
  SetCriterionStatusCommand,
  UpdateCriterionWeightsCommand,
} from "../commands/MethodologyCommands";

export class MethodologyApplicationService {
  constructor(
    private readonly useCases: Pick<
      AllUseCases,
      | "createMethodology"
      | "reviseMethodology"
      | "registerCriterion"
      | "setCriterionStatus"
      | "updateCriterionWeights"
    >,
  ) {}

  create(command: CreateMethodologyCommand) {
    return this.useCases.createMethodology.execute(command);
  }

  revise(command: ReviseMethodologyCommand) {
    return this.useCases.reviseMethodology.execute(command);
  }

  registerCriterion(command: RegisterCriterionCommand) {
    return this.useCases.registerCriterion.execute(command);
  }

  setCriterionStatus(
    command: SetCriterionStatusCommand,
    affectedMethodologyIds?: readonly string[],
  ) {
    return this.useCases.setCriterionStatus.execute(command, affectedMethodologyIds);
  }

  updateWeights(command: UpdateCriterionWeightsCommand) {
    return this.useCases.updateCriterionWeights.execute(command);
  }
}
