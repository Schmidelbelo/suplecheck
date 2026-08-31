import type { MethodologyRepositoryPort, MethodologyDTO } from "../application-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";

/** Chave composta id@version — permite guardar todas as versões sem sobrescrever histórico (ver Methodology.revise, Domain). */
function versionKey(id: string, version: string): string {
  return `${id}@${version}`;
}

export class InMemoryMethodologyRepository implements MethodologyRepositoryPort {
  private readonly byVersionKey: Map<string, MethodologyDTO>;
  private readonly activeByCategory: Map<string, string>;

  constructor(db: InMemoryDatabase) {
    this.byVersionKey = db.table<MethodologyDTO>("methodologies");
    this.activeByCategory = db.table<string>("methodology_active_by_category");
  }

  async findById(id: string): Promise<MethodologyDTO | null> {
    const versions = [...this.byVersionKey.values()].filter((m) => m.id === id);
    versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    return versions[0] ?? null;
  }

  async findActiveForCategory(categorySlug: string): Promise<MethodologyDTO | null> {
    const key = this.activeByCategory.get(categorySlug);
    return key ? (this.byVersionKey.get(key) ?? null) : null;
  }

  async listVersions(methodologyId: string): Promise<MethodologyDTO[]> {
    return [...this.byVersionKey.values()].filter((m) => m.id === methodologyId);
  }

  async save(methodology: MethodologyDTO): Promise<void> {
    this.byVersionKey.set(versionKey(methodology.id, methodology.version), methodology);
  }

  async setActiveForCategory(
    categorySlug: string,
    methodologyId: string,
    version: string,
  ): Promise<void> {
    this.activeByCategory.set(categorySlug, versionKey(methodologyId, version));
  }
}
