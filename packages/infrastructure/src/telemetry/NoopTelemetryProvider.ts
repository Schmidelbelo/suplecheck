import type { TelemetryProvider, Span } from "./TelemetryProvider";

const NOOP_SPAN: Span = { end: () => {}, recordError: () => {} };

/**
 * Null Object — nenhum provedor de observabilidade (Datadog, Sentry,
 * OpenTelemetry Collector...) está conectado ainda. Todo código que
 * depende de `TelemetryProvider` continua funcionando sem alteração
 * quando um provedor real for adicionado — só troca esta instância na
 * composição (`bootstrap/InfrastructureContainer.ts`).
 */
export class NoopTelemetryProvider implements TelemetryProvider {
  startSpan(): Span {
    return NOOP_SPAN;
  }
  recordMetric(): void {}
}
