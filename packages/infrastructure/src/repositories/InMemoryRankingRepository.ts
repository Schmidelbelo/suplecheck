import type { RankingRepositoryPort, RankingDTO } from "../application-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";

export class InMemoryRankingRepository implements RankingRepositoryPort {
  private readonly byCategory: Map<string, RankingDTO>;

  constructor(db: InMemoryDatabase) {
    this.byCategory = db.table<RankingDTO>("rankings");
  }

  async save(ranking: RankingDTO): Promise<void> {
    this.byCategory.set(ranking.categorySlug, ranking);
  }

  async findLatest(categorySlug: string): Promise<RankingDTO | null> {
    return this.byCategory.get(categorySlug) ?? null;
  }
}
