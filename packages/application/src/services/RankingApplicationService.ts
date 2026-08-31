import type { AllUseCases } from "../factories/UseCaseFactory";
import type { GenerateRankingCommand } from "../commands/RankingCommands";
import type { GetRankingQuery } from "../queries/CatalogQueries";
import type { RankingRepositoryPort } from "../ports/RankingRepositoryPort";
import { IndexResultNotFoundError } from "../errors/ApplicationError";

export class RankingApplicationService {
  constructor(
    private readonly useCases: Pick<AllUseCases, "generateRanking">,
    private readonly rankings: RankingRepositoryPort,
  ) {}

  generate(command: GenerateRankingCommand) {
    return this.useCases.generateRanking.execute(command);
  }

  /**
   * Leitura pura do último snapshot já gerado — não recalcula (isso é
   * `generate`). Não há um `GetRankingUseCase` dedicado porque a leitura
   * é uma passagem direta por um único Port, sem regra de negócio
   * própria; criar um Use Case só para isso seria indireção sem ganho —
   * mas o Service ainda existe como fachada estável para quem consome.
   */
  async get(query: GetRankingQuery) {
    const ranking = await this.rankings.findLatest(query.categorySlug);
    if (!ranking) throw new IndexResultNotFoundError(query.categorySlug);
    return ranking;
  }
}
