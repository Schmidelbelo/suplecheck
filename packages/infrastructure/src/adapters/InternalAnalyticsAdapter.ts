import type { AnalyticsPort, AnalyticsEvent } from "../application-kernel";
import type { Logger } from "../logging/Logger";

/**
 * Implementa `AnalyticsPort` (Application — eventos internos de
 * negócio, ex: "index_calculated") registrando via `Logger`. Distinto
 * de `external-apis/analytics/` (GA/Clarity — comportamento de usuário
 * final na página, não decisão de servidor).
 */
export class InternalAnalyticsAdapter implements AnalyticsPort {
  constructor(private readonly logger: Logger) {}

  async track(event: AnalyticsEvent): Promise<void> {
    this.logger.info(`analytics: ${event.name}`, { ...event.properties });
  }
}
