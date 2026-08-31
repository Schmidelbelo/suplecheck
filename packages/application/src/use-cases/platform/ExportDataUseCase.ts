import type { UseCase } from "../../shared/UseCase";
import type { ExportDataCommand } from "../../commands/PlatformCommands";
import type { ExportSinkPort } from "../../ports/ImportExportPorts";
import { NotImplementedYetError } from "../../errors/ApplicationError";

/**
 * Esqueleto deliberado (ver ARCHITECTURE.md §7). O contrato (Command +
 * `ExportSinkPort`/`ExportArtifact`) já existe; falta decidir o que
 * exatamente é exportado por padrão (só suplementos? inclui histórico de
 * Índice? metodologias?) antes de implementar a serialização de verdade
 * — um artefato vazio "funcionando" seria pior que um erro explícito,
 * por poder ser confundido com um export real.
 */
export class ExportDataUseCase implements UseCase<
  { command: ExportDataCommand; sink: ExportSinkPort },
  void
> {
  async execute(): Promise<void> {
    throw new NotImplementedYetError("Exportar dados");
  }
}
