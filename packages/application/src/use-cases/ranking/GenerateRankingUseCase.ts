import type { UseCase } from "../../shared/UseCase";
import type { GenerateRankingCommand } from "../../commands/RankingCommands";
import type { RankingDTO } from "../../dto/RankingDTO";
import type { IndexResultRepositoryPort } from "../../ports/IndexResultRepositoryPort";
import type { MethodologyRepositoryPort } from "../../ports/MethodologyRepositoryPort";
import type { RankingRepositoryPort } from "../../ports/RankingRepositoryPort";
import type { ClockPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import type { AnalyticsPort } from "../../ports/AnalyticsPort";
import { RankingMapper } from "../../mappers/RankingMapper";
import { RankingGenerationPolicy } from "../../policies/RankingGenerationPolicy";
import { MethodologyNotFoundError } from "../../errors/ApplicationError";

/**
 * Gera e persiste um snapshot de ranking para uma categoria, a partir do
 * último Índice já calculado de cada suplemento (não recalcula nada —
 * isso já deve ter acontecido via `EvaluateSupplementUseCase`). Rodar
 * este Use Case é uma operação explícita, não automática a cada
 * avaliação — permite gerar o ranking sob demanda ou em um job agendado,
 * sem acoplar `EvaluateSupplementUseCase` a "e agora recalcule o ranking
 * inteiro".
 */
export class GenerateRankingUseCase implements UseCase<GenerateRankingCommand, RankingDTO> {
  private readonly generationPolicy = new RankingGenerationPolicy();

  constructor(
    private readonly indexResults: IndexResultRepositoryPort,
    private readonly methodologies: MethodologyRepositoryPort,
    private readonly rankings: RankingRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
    private readonly analytics: AnalyticsPort,
  ) {}

  async execute(command: GenerateRankingCommand): Promise<RankingDTO> {
    const methodology = command.methodologyId
      ? await this.methodologies.findById(command.methodologyId)
      : await this.methodologies.findActiveForCategory(command.categorySlug);
    if (!methodology) {
      throw new MethodologyNotFoundError(
        command.methodologyId ?? `ativa para "${command.categorySlug}"`,
      );
    }

    const results = await this.indexResults.listLatestByCategory(command.categorySlug);
    this.generationPolicy.assertCanGenerate(command.categorySlug, results.length);

    const now = this.clock.now();
    const ranking = RankingMapper.build(
      command.categorySlug,
      methodology.id,
      methodology.version,
      results,
      now,
    );

    await this.rankings.save(ranking);
    await this.auditLog.record({
      actorId: "system",
      action: "ranking.generated",
      entityType: "ranking",
      entityId: command.categorySlug,
      metadata: { methodologyId: methodology.id, entryCount: ranking.entries.length },
      occurredAt: now,
    });
    await this.analytics.track({
      name: "ranking_generated",
      properties: { categorySlug: command.categorySlug, entryCount: ranking.entries.length },
      occurredAt: now,
    });

    return ranking;
  }
}
