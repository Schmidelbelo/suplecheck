/**
 * Adapters em memória para TODOS os Ports da Application Layer — NÃO é
 * Infrastructure real (não fala com Prisma, banco algum ou serviço
 * externo). Existe só para o smoke test (`scripts/smoke.ts`) provar que
 * a fiação (Use Cases → Ports → Domain) funciona de ponta a ponta sem
 * precisar de banco. Quando Infrastructure existir, estes adapters são
 * descartados — eles nunca são importados por nenhum Use Case, Service
 * ou Factory de produção, só pelo smoke test.
 */
import type { CriterionId } from "../src/domain-kernel";
import {
  builtInCriteria,
  CriterionRegistry,
  CriterionStatus,
  type Criterion,
} from "../src/domain-kernel";
import type {
  SupplementRepositoryPort,
  SupplementRecord,
  SupplementSearchCriteria,
  SupplementSort,
  ProductStatus,
} from "../src/ports/SupplementRepositoryPort";
import type {
  CategoryRepositoryPort,
  BrandRepositoryPort,
  ManufacturerRepositoryPort,
  CategoryRecord,
  BrandRecord,
  ManufacturerRecord,
  ReferenceDataSearchCriteria,
  ReferenceDataSort,
} from "../src/ports/CatalogRepositoryPort";
import type { SkuRepositoryPort, SkuRecord } from "../src/ports/SkuRepositoryPort";
import type { MethodologyRepositoryPort } from "../src/ports/MethodologyRepositoryPort";
import type { CriterionCatalogPort } from "../src/ports/CriterionCatalogPort";
import type { IndexResultRepositoryPort } from "../src/ports/IndexResultRepositoryPort";
import type { RankingRepositoryPort } from "../src/ports/RankingRepositoryPort";
import type { AuditEntry, AuditLogPort } from "../src/ports/AuditLogPort";
import type { AnalyticsEvent, AnalyticsPort } from "../src/ports/AnalyticsPort";
import type { ClockPort, IdGeneratorPort } from "../src/ports/SystemPorts";
import type { PageRequest, PageResult } from "../src/shared/Pagination";
import type { MethodologyDTO } from "../src/dto/MethodologyDTO";
import type { IndexResultDTO } from "../src/dto/IndexResultDTO";
import type { RankingDTO } from "../src/dto/RankingDTO";

function paginate<T>(all: T[], page: PageRequest): PageResult<T> {
  const start = (page.page - 1) * page.perPage;
  return {
    items: all.slice(start, start + page.perPage),
    page: page.page,
    perPage: page.perPage,
    total: all.length,
    totalPages: Math.max(1, Math.ceil(all.length / page.perPage)),
  };
}

function sortByName<T extends { name: string; createdAt: Date }>(items: T[], sort?: string): T[] {
  const copy = [...items];
  if (sort === "name-desc") return copy.sort((a, b) => b.name.localeCompare(a.name));
  if (sort === "recent") return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return copy.sort((a, b) => a.name.localeCompare(b.name));
}

export class InMemorySupplementRepository implements SupplementRepositoryPort {
  private readonly byId = new Map<string, SupplementRecord>();

  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findBySlug(slug: string) {
    return [...this.byId.values()].find((r) => r.slug === slug) ?? null;
  }
  async findManyByIds(ids: readonly string[]) {
    return ids.map((id) => this.byId.get(id)).filter((r): r is SupplementRecord => r !== undefined);
  }
  async search(
    criteria: SupplementSearchCriteria,
    page: PageRequest,
    sort?: SupplementSort,
  ): Promise<PageResult<SupplementRecord>> {
    const all = sortByName(
      [...this.byId.values()].filter(
        (r) =>
          (!criteria.categorySlug || r.categorySlug === criteria.categorySlug) &&
          (!criteria.brandSlug || r.brandSlug === criteria.brandSlug) &&
          (!criteria.status || r.status === criteria.status) &&
          (!criteria.search || r.name.toLowerCase().includes(criteria.search.toLowerCase())),
      ),
      sort,
    );
    return paginate(all, page);
  }
  async save(record: SupplementRecord) {
    this.byId.set(record.id, record);
  }
  async setStatus(id: string, status: ProductStatus) {
    const existing = this.byId.get(id);
    if (existing) this.byId.set(id, { ...existing, status, updatedAt: new Date() });
  }
}

abstract class InMemoryReferenceDataRepository<
  T extends { id: string; slug: string; name: string; active: boolean; createdAt: Date },
> {
  protected readonly byId = new Map<string, T>();

  async listAll() {
    return [...this.byId.values()];
  }
  async search(criteria: ReferenceDataSearchCriteria, page: PageRequest, sort?: ReferenceDataSort) {
    const filtered = sortByName(
      [...this.byId.values()].filter(
        (r) =>
          (criteria.includeInactive || r.active) &&
          (!criteria.search || r.name.toLowerCase().includes(criteria.search.toLowerCase())),
      ),
      sort,
    );
    return paginate(filtered, page);
  }
  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findBySlug(slug: string) {
    return [...this.byId.values()].find((r) => r.slug === slug) ?? null;
  }
  async save(record: T) {
    this.byId.set(record.id, record);
  }
  async setActive(id: string, active: boolean) {
    const existing = this.byId.get(id);
    if (existing) this.byId.set(id, { ...existing, active });
  }
}

export class InMemoryCategoryRepository
  extends InMemoryReferenceDataRepository<CategoryRecord>
  implements CategoryRepositoryPort
{
  constructor(seed: readonly CategoryRecord[] = []) {
    super();
    for (const record of seed) this.byId.set(record.id, record);
  }
}

export class InMemoryBrandRepository
  extends InMemoryReferenceDataRepository<BrandRecord>
  implements BrandRepositoryPort
{
  constructor(seed: readonly BrandRecord[] = []) {
    super();
    for (const record of seed) this.byId.set(record.id, record);
  }
}

export class InMemoryManufacturerRepository
  extends InMemoryReferenceDataRepository<ManufacturerRecord>
  implements ManufacturerRepositoryPort
{
  constructor(seed: readonly ManufacturerRecord[] = []) {
    super();
    for (const record of seed) this.byId.set(record.id, record);
  }
}

export class InMemorySkuRepository implements SkuRepositoryPort {
  private readonly byId = new Map<string, SkuRecord>();

  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByGtin(gtin: string) {
    return [...this.byId.values()].find((r) => r.gtin === gtin) ?? null;
  }
  async listByProduct(productId: string, page: PageRequest) {
    const all = [...this.byId.values()].filter((r) => r.productId === productId);
    return paginate(all, page);
  }
  async save(record: SkuRecord) {
    this.byId.set(record.id, record);
  }
  async setStatus(id: string, status: SkuRecord["status"]) {
    const existing = this.byId.get(id);
    if (existing) this.byId.set(id, { ...existing, status, updatedAt: new Date() });
  }
}

export class InMemoryMethodologyRepository implements MethodologyRepositoryPort {
  private readonly byIdVersion = new Map<string, MethodologyDTO>();
  private readonly activeByCategory = new Map<string, string>();

  async findById(id: string) {
    // Retorna a versão mais recente conhecida para este id.
    const versions = [...this.byIdVersion.values()].filter((m) => m.id === id);
    versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    return versions[0] ?? null;
  }
  async findActiveForCategory(categorySlug: string) {
    const key = this.activeByCategory.get(categorySlug);
    if (!key) return null;
    return this.byIdVersion.get(key) ?? null;
  }
  async listVersions(methodologyId: string) {
    return [...this.byIdVersion.values()].filter((m) => m.id === methodologyId);
  }
  async save(methodology: MethodologyDTO) {
    this.byIdVersion.set(`${methodology.id}@${methodology.version}`, methodology);
  }
  async setActiveForCategory(categorySlug: string, methodologyId: string, version: string) {
    this.activeByCategory.set(categorySlug, `${methodologyId}@${version}`);
  }
}

export class InMemoryCriterionCatalog implements CriterionCatalogPort {
  private readonly criteria = new Map<string, Criterion>();
  private readonly statuses = new Map<string, CriterionStatus>();

  constructor() {
    for (const criterion of builtInCriteria()) {
      this.criteria.set(criterion.metadata.id.value, criterion);
      this.statuses.set(criterion.metadata.id.value, CriterionStatus.ACTIVE);
    }
  }

  async loadRegistry() {
    const registry = new CriterionRegistry();
    for (const [id, criterion] of this.criteria) {
      registry.register(criterion, this.statuses.get(id));
    }
    return registry;
  }
  async register(criterion: Criterion) {
    this.criteria.set(criterion.metadata.id.value, criterion);
    this.statuses.set(criterion.metadata.id.value, CriterionStatus.ACTIVE);
  }
  async setStatus(criterionId: CriterionId, status: CriterionStatus) {
    this.statuses.set(criterionId.value, status);
  }
  async listAll() {
    return [...this.criteria.values()];
  }
}

export class InMemoryIndexResultRepository implements IndexResultRepositoryPort {
  private readonly bySupplementId = new Map<string, IndexResultDTO[]>();

  async save(result: IndexResultDTO) {
    const list = this.bySupplementId.get(result.supplementId) ?? [];
    list.unshift(result);
    this.bySupplementId.set(result.supplementId, list);
  }
  async findLatest(supplementId: string) {
    return this.bySupplementId.get(supplementId)?.[0] ?? null;
  }
  async listHistory(supplementId: string) {
    return this.bySupplementId.get(supplementId) ?? [];
  }
  async listLatestByCategory(categorySlug: string) {
    const latestPerSupplement = [...this.bySupplementId.values()]
      .map((list) => list[0])
      .filter((r): r is IndexResultDTO => r !== undefined);
    return latestPerSupplement.filter((r) => r.categorySlug === categorySlug);
  }
}

export class InMemoryRankingRepository implements RankingRepositoryPort {
  private readonly byCategory = new Map<string, RankingDTO>();
  async save(ranking: RankingDTO) {
    this.byCategory.set(ranking.categorySlug, ranking);
  }
  async findLatest(categorySlug: string) {
    return this.byCategory.get(categorySlug) ?? null;
  }
}

export class InMemoryAuditLog implements AuditLogPort {
  readonly entries: AuditEntry[] = [];
  async record(entry: AuditEntry) {
    this.entries.push(entry);
  }
}

export class InMemoryAnalytics implements AnalyticsPort {
  readonly events: AnalyticsEvent[] = [];
  async track(event: AnalyticsEvent) {
    this.events.push(event);
  }
}

export class FixedClock implements ClockPort {
  constructor(private readonly fixedNow: Date = new Date("2026-08-31T12:00:00Z")) {}
  now() {
    return this.fixedNow;
  }
}

export class SequentialIdGenerator implements IdGeneratorPort {
  private counter = 0;
  next() {
    this.counter += 1;
    return `id_${this.counter}`;
  }
}
