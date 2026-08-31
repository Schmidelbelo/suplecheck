export type ScheduledTask = () => Promise<void>;

/** Agendamento de tarefas recorrentes/futuras (ex: gerar ranking toda madrugada). */
export interface SchedulerProvider {
  /** `cronExpression` no formato padrão de 5 campos — o provider decide como interpretar. */
  schedule(name: string, cronExpression: string, task: ScheduledTask): void;
  cancel(name: string): void;
}
