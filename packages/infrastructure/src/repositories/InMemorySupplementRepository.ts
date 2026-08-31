import type {
  SupplementRepositoryPort,
  SupplementRecord,
  SupplementSearchCriteria,
  PageRequest,
  PageResult,
} from "../application-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";

/**
 * Implementação real (não stub) de `SupplementRepositoryPort` sobre
 * `InMemoryDatabase`. É a implementação padrão da plataforma até o
 * adapter Prisma (`PrismaSupplementRepositoryStub`) ser completado —
 * "in-memory" não significa "de mentira", significa "sem dependência
 * externa"; os dados são reais durante a vida do processo.
 */
export class InMemorySupplementRepository implements SupplementRepositoryPort {
  private readonly byId: Map<string, SupplementRecord>;

  constructor(db: InMemoryDatabase) {
    this.byId = db.table<SupplementRecord>("supplements");
  }

  async findById(id: string): Promise<SupplementRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<SupplementRecord | null> {
    return [...this.byId.values()].find((record) => record.slug === slug) ?? null;
  }

  async findManyByIds(ids: readonly string[]): Promise<SupplementRecord[]> {
    return ids.map((id) => this.byId.get(id)).filter((r): r is SupplementRecord => r !== undefined);
  }

  async search(
    criteria: SupplementSearchCriteria,
    page: PageRequest,
  ): Promise<PageResult<SupplementRecord>> {
    const all = [...this.byId.values()].filter(
      (record) =>
        (!criteria.categorySlug || record.categorySlug === criteria.categorySlug) &&
        (!criteria.brandSlug || record.brandSlug === criteria.brandSlug) &&
        (!criteria.search || record.name.toLowerCase().includes(criteria.search.toLowerCase())),
    );

    const start = (page.page - 1) * page.perPage;
    return {
      items: all.slice(start, start + page.perPage),
      page: page.page,
      perPage: page.perPage,
      total: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / page.perPage)),
    };
  }

  async save(record: SupplementRecord): Promise<void> {
    this.byId.set(record.id, record);
  }
}
