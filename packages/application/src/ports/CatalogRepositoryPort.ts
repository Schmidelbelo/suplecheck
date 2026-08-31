export interface CategoryRecord {
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly parentSlug?: string;
}

export interface BrandRecord {
  readonly slug: string;
  readonly name: string;
  readonly logoUrl?: string;
}

export interface CategoryRepositoryPort {
  listAll(): Promise<CategoryRecord[]>;
  findBySlug(slug: string): Promise<CategoryRecord | null>;
}

export interface BrandRepositoryPort {
  listAll(): Promise<BrandRecord[]>;
  findBySlug(slug: string): Promise<BrandRecord | null>;
}
