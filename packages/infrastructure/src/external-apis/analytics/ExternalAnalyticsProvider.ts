/**
 * Analytics de comportamento de usuário final (page views, cliques) —
 * distinto de `AnalyticsPort` (Application, eventos internos de negócio
 * como "índice_calculado"). Estes provedores rodam tipicamente no
 * browser (a plataforma já injeta os scripts em
 * `src/modules/analytics/components/AnalyticsScripts.tsx`, na Fase 0) —
 * a contraparte server-side existe aqui só para eventos que fazem mais
 * sentido disparados do servidor (ex: confirmação de conversão).
 */
export interface ExternalAnalyticsProvider {
  readonly providerName: string;
  trackServerEvent(
    name: string,
    properties: Readonly<Record<string, string | number | boolean>>,
  ): Promise<void>;
}
