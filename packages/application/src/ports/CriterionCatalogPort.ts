import type { Criterion, CriterionId, CriterionStatus, CriterionRegistry } from "../domain-kernel";

/**
 * Port de acesso ao catálogo de critérios disponíveis. Note a diferença
 * em relação a `CriterionRegistry` (Domain): o registro é um objeto de
 * runtime, montado em memória a cada processo; este Port é quem monta
 * esse registro (carregando critérios embutidos + quaisquer outros
 * registrados dinamicamente) e persiste o status (ativo/desativado) para
 * sobreviver a um restart — a Application não sabe SE isso vem de um
 * banco, de configuração estática ou de outra fonte.
 */
export interface CriterionCatalogPort {
  /** Monta o `CriterionRegistry` com todos os critérios conhecidos, já com o status persistido aplicado. */
  loadRegistry(): Promise<CriterionRegistry>;
  register(criterion: Criterion): Promise<void>;
  setStatus(criterionId: CriterionId, status: CriterionStatus): Promise<void>;
  listAll(): Promise<Criterion[]>;
}
