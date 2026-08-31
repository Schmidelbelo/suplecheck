import type { IndexResultRepositoryPort, IndexResultDTO } from "../application-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";

export class InMemoryIndexResultRepository implements IndexResultRepositoryPort {
  private readonly bySupplementId: Map<string, IndexResultDTO[]>;

  constructor(db: InMemoryDatabase) {
    this.bySupplementId = db.table<IndexResultDTO[]>("index_results");
  }

  async save(result: IndexResultDTO): Promise<void> {
    const list = this.bySupplementId.get(result.supplementId) ?? [];
    list.unshift(result); // mais recente primeiro
    this.bySupplementId.set(result.supplementId, list);
  }

  async findLatest(supplementId: string): Promise<IndexResultDTO | null> {
    return this.bySupplementId.get(supplementId)?.[0] ?? null;
  }

  async listHistory(supplementId: string): Promise<IndexResultDTO[]> {
    return this.bySupplementId.get(supplementId) ?? [];
  }

  async listLatestByCategory(categorySlug: string): Promise<IndexResultDTO[]> {
    return [...this.bySupplementId.values()]
      .map((list) => list[0])
      .filter((result): result is IndexResultDTO => result !== undefined)
      .filter((result) => result.categorySlug === categorySlug);
  }
}
