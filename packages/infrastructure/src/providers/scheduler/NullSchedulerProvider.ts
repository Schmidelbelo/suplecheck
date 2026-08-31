import type { SchedulerProvider, ScheduledTask } from "./SchedulerProvider";
import type { Logger } from "../../logging/Logger";

/**
 * Null Object — registra a intenção de agendamento (útil para conferir,
 * em teste/dev, "isso teria sido agendado") mas nunca dispara `task`
 * sozinho. Um scheduler real (cron do sistema, um serviço gerenciado)
 * troca esta instância sem exigir mudança em quem chama `schedule()`.
 */
export class NullSchedulerProvider implements SchedulerProvider {
  private readonly scheduled = new Map<string, { cronExpression: string; task: ScheduledTask }>();

  constructor(private readonly logger: Logger) {}

  schedule(name: string, cronExpression: string, task: ScheduledTask): void {
    this.scheduled.set(name, { cronExpression, task });
    this.logger.info("tarefa registrada (scheduler null — nunca dispara sozinho)", {
      name,
      cronExpression,
    });
  }

  cancel(name: string): void {
    this.scheduled.delete(name);
  }
}
