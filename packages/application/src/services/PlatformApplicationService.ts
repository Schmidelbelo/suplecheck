import type { AllUseCases } from "../factories/UseCaseFactory";
import type {
  RecordAuditEntryCommand,
  RecordAnalyticsEventCommand,
} from "../commands/PlatformCommands";

/** Fachada de operações transversais de plataforma (auditoria, analytics). Import/Export ficam de fora deliberadamente — exigem um Port concreto por chamada (`source`/`sink`), não fazem sentido como método de zero argumentos. */
export class PlatformApplicationService {
  constructor(
    private readonly useCases: Pick<AllUseCases, "recordAuditEntry" | "recordAnalyticsEvent">,
  ) {}

  recordAudit(command: RecordAuditEntryCommand) {
    return this.useCases.recordAuditEntry.execute(command);
  }

  recordAnalytics(command: RecordAnalyticsEventCommand) {
    return this.useCases.recordAnalyticsEvent.execute(command);
  }
}
