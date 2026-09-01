import type { AllUseCases } from "../factories/UseCaseFactory";
import type {
  RegisterSupplementCommand,
  UpdateSupplementCommand,
  EvaluateSupplementCommand,
  SetSupplementStatusCommand,
  DeleteSupplementCommand,
} from "../commands/SupplementCommands";
import type { SearchSupplementsQuery, CompareSupplementsQuery } from "../queries/CatalogQueries";

/**
 * Fachada de tudo relacionado a "um suplemento" — o objeto que
 * Infrastructure/Presentation instanciam quando só querem "o serviço de
 * suplementos", sem se importar em saber quantos Use Cases existem por
 * trás nem como cada um é montado. Um Application Service não tem regra
 * de negócio própria; ele só delega para os Use Cases certos.
 */
export class SupplementApplicationService {
  constructor(
    private readonly useCases: Pick<
      AllUseCases,
      | "registerSupplement"
      | "updateSupplement"
      | "evaluateSupplement"
      | "getSupplement"
      | "setSupplementStatus"
      | "deleteSupplement"
      | "searchSupplements"
      | "compareSupplements"
    >,
  ) {}

  register(command: RegisterSupplementCommand) {
    return this.useCases.registerSupplement.execute(command);
  }

  update(command: UpdateSupplementCommand) {
    return this.useCases.updateSupplement.execute(command);
  }

  evaluate(command: EvaluateSupplementCommand) {
    return this.useCases.evaluateSupplement.execute(command);
  }

  get(idOrSlug: string) {
    return this.useCases.getSupplement.execute(idOrSlug);
  }

  setStatus(command: SetSupplementStatusCommand) {
    return this.useCases.setSupplementStatus.execute(command);
  }

  delete(command: DeleteSupplementCommand) {
    return this.useCases.deleteSupplement.execute(command);
  }

  search(query: SearchSupplementsQuery) {
    return this.useCases.searchSupplements.execute(query);
  }

  compare(query: CompareSupplementsQuery) {
    return this.useCases.compareSupplements.execute(query);
  }
}
