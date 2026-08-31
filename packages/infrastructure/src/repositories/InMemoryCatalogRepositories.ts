import type {
  CategoryRepositoryPort,
  BrandRepositoryPort,
  CategoryRecord,
  BrandRecord,
} from "../application-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";

export class InMemoryCategoryRepository implements CategoryRepositoryPort {
  private readonly bySlug: Map<string, CategoryRecord>;

  constructor(db: InMemoryDatabase, seed: readonly CategoryRecord[] = []) {
    this.bySlug = db.table<CategoryRecord>("categories");
    for (const category of seed) {
      if (!this.bySlug.has(category.slug)) this.bySlug.set(category.slug, category);
    }
  }

  async listAll(): Promise<CategoryRecord[]> {
    return [...this.bySlug.values()];
  }

  async findBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.bySlug.get(slug) ?? null;
  }
}

export class InMemoryBrandRepository implements BrandRepositoryPort {
  private readonly bySlug: Map<string, BrandRecord>;

  constructor(db: InMemoryDatabase, seed: readonly BrandRecord[] = []) {
    this.bySlug = db.table<BrandRecord>("brands");
    for (const brand of seed) {
      if (!this.bySlug.has(brand.slug)) this.bySlug.set(brand.slug, brand);
    }
  }

  async listAll(): Promise<BrandRecord[]> {
    return [...this.bySlug.values()];
  }

  async findBySlug(slug: string): Promise<BrandRecord | null> {
    return this.bySlug.get(slug) ?? null;
  }
}
