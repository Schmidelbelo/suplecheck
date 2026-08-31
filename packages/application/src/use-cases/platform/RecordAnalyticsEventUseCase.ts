import type { UseCase } from "../../shared/UseCase";
import type { RecordAnalyticsEventCommand } from "../../commands/PlatformCommands";
import type { AnalyticsPort } from "../../ports/AnalyticsPort";
import type { ClockPort } from "../../ports/SystemPorts";

export class RecordAnalyticsEventUseCase implements UseCase<RecordAnalyticsEventCommand, void> {
  constructor(
    private readonly analytics: AnalyticsPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: RecordAnalyticsEventCommand): Promise<void> {
    await this.analytics.track({
      name: command.name,
      properties: command.properties ?? {},
      occurredAt: this.clock.now(),
    });
  }
}
