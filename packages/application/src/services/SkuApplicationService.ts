import type { AllUseCases } from "../factories/UseCaseFactory";
import type {
  CreateSkuCommand,
  UpdateSkuCommand,
  SetSkuStatusCommand,
} from "../commands/SkuCommands";
import type { ListSkusByProductQuery } from "../queries/CatalogQueries";

export class SkuApplicationService {
  constructor(
    private readonly useCases: Pick<
      AllUseCases,
      "createSku" | "updateSku" | "setSkuStatus" | "getSku" | "listSkusByProduct"
    >,
  ) {}

  create(command: CreateSkuCommand) {
    return this.useCases.createSku.execute(command);
  }

  update(command: UpdateSkuCommand) {
    return this.useCases.updateSku.execute(command);
  }

  setStatus(command: SetSkuStatusCommand) {
    return this.useCases.setSkuStatus.execute(command);
  }

  /** Soft delete — SKU não some, transiciona para DISCONTINUED. */
  delete(id: string) {
    return this.useCases.setSkuStatus.execute({ id, status: "DISCONTINUED" });
  }

  get(id: string) {
    return this.useCases.getSku.execute(id);
  }

  listByProduct(query: ListSkusByProductQuery) {
    return this.useCases.listSkusByProduct.execute(query);
  }
}
