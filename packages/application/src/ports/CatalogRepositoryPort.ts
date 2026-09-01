import type { PageRequest, PageResult } from "../shared/Pagination";

export interface CategoryRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly parentSlug?: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface BrandRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl?: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ManufacturerRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly country?: string;
  readonly certifications: readonly string[];
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ReferenceDataSearchCriteria {
  readonly search?: string;
  readonly includeInactive?: boolean;
}

export type ReferenceDataSort = "name-asc" | "name-desc" | "recent";

export interface CategoryRepositoryPort {
  /** Sem paginação/filtro — usado por telas que precisam da árvore inteira (ex: menus). */
  listAll(): Promise<CategoryRecord[]>;
  search(
    criteria: ReferenceDataSearchCriteria,
    page: PageRequest,
    sort?: ReferenceDataSort,
  ): Promise<PageResult<CategoryRecord>>;
  findById(id: string): Promise<CategoryRecord | null>;
  findBySlug(slug: string): Promise<CategoryRecord | null>;
  save(record: CategoryRecord): Promise<void>;
  /** Soft delete — nunca remove fisicamente (Domain Model §3.1). */
  setActive(id: string, active: boolean): Promise<void>;
}

export interface BrandRepositoryPort {
  listAll(): Promise<BrandRecord[]>;
  search(
    criteria: ReferenceDataSearchCriteria,
    page: PageRequest,
    sort?: ReferenceDataSort,
  ): Promise<PageResult<BrandRecord>>;
  findById(id: string): Promise<BrandRecord | null>;
  findBySlug(slug: string): Promise<BrandRecord | null>;
  save(record: BrandRecord): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
}

export interface ManufacturerRepositoryPort {
  listAll(): Promise<ManufacturerRecord[]>;
  search(
    criteria: ReferenceDataSearchCriteria,
    page: PageRequest,
    sort?: ReferenceDataSort,
  ): Promise<PageResult<ManufacturerRecord>>;
  findById(id: string): Promise<ManufacturerRecord | null>;
  findBySlug(slug: string): Promise<ManufacturerRecord | null>;
  save(record: ManufacturerRecord): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
}
