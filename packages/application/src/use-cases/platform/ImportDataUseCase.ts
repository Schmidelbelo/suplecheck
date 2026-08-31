import type { UseCase } from "../../shared/UseCase";
import type { ImportDataCommand } from "../../commands/PlatformCommands";
import type { ImportSourcePort } from "../../ports/ImportExportPorts";
import { NotImplementedYetError } from "../../errors/ApplicationError";

export interface ImportDataResult {
  readonly recordsRead: number;
  readonly recordsImported: number;
  readonly errors: readonly string[];
}

/**
 * Esqueleto deliberado (ver ARCHITECTURE.md §7). A forma final depende
 * de decisões ainda não tomadas — formato de origem, mapeamento
 * campo-a-campo para `RegisterSupplementCommand`/`EvaluateSupplementCommand`,
 * estratégia de dry-run — por isso o Port (`ImportSourcePort`) e o
 * contrato de entrada/saída já existem, mas a orquestração real (ler →
 * validar → registrar em lote → relatar) fica para quando houver uma
 * fonte de import concreta para desenhar contra.
 */
export class ImportDataUseCase implements UseCase<
  { command: ImportDataCommand; source: ImportSourcePort },
  ImportDataResult
> {
  async execute(): Promise<ImportDataResult> {
    throw new NotImplementedYetError("Importar dados");
  }
}
