export interface ImportDataCommand {
  readonly sourceName: string;
  readonly categorySlug: string;
  readonly dryRun?: boolean;
}

export interface ExportDataCommand {
  readonly categorySlug?: string;
  readonly format: "json" | "csv";
}

export interface RecordAuditEntryCommand {
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RecordAnalyticsEventCommand {
  readonly name: string;
  readonly properties?: Readonly<Record<string, string | number | boolean | undefined>>;
}
