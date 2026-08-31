export interface AnalyticsEvent {
  readonly name: string;
  readonly properties: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly occurredAt: Date;
}

/**
 * Port para eventos de analytics *internos* da plataforma (ex:
 * "índice_calculado", "ranking_gerado") — distinto do módulo
 * `modules/analytics` do app web (que fala com GA/Clarity a partir do
 * browser). Aqui é o servidor registrando um fato de negócio, não o
 * cliente registrando um clique.
 */
export interface AnalyticsPort {
  track(event: AnalyticsEvent): Promise<void>;
}
