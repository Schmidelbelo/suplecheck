export interface ImportRecord {
  readonly raw: Readonly<Record<string, unknown>>;
  readonly sourceLine?: number;
}

/**
 * Fonte de dados externos para importação em massa (ex: uma planilha de
 * curadoria manual da Fase 0, um feed de outro sistema no futuro). A
 * Application não sabe se isso é um CSV, uma API ou um arquivo local —
 * só sabe que pode pedir "os próximos registros".
 */
export interface ImportSourcePort {
  readonly name: string;
  read(): Promise<ImportRecord[]>;
}

export interface ExportArtifact {
  readonly format: "json" | "csv";
  readonly content: string;
  readonly generatedAt: Date;
}

/** Destino de um export (arquivo local, bucket, resposta HTTP) — a Application só entrega o artefato pronto. */
export interface ExportSinkPort {
  write(artifact: ExportArtifact): Promise<void>;
}
