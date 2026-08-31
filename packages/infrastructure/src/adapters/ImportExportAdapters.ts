import type {
  ImportSourcePort,
  ImportRecord,
  ExportSinkPort,
  ExportArtifact,
} from "../application-kernel";
import type { Logger } from "../logging/Logger";

/** Fonte de importação em memória — útil para testes/seed local; alimentada explicitamente com registros (nunca lê arquivo/rede sozinha). */
export class InMemoryImportSourceAdapter implements ImportSourcePort {
  readonly name = "in-memory";

  constructor(private readonly records: readonly ImportRecord[] = []) {}

  async read(): Promise<ImportRecord[]> {
    return [...this.records];
  }
}

/** Descarta o artefato de export, só registrando que ele foi gerado — placeholder até existir um destino real (S3/R2/download HTTP). */
export class NullExportSinkAdapter implements ExportSinkPort {
  constructor(private readonly logger: Logger) {}

  async write(artifact: ExportArtifact): Promise<void> {
    this.logger.info("export gerado (destino ainda não conectado)", {
      format: artifact.format,
      bytes: artifact.content.length,
      generatedAt: artifact.generatedAt.toISOString(),
    });
  }
}
