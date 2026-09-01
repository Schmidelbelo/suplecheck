import type { PrismaClient } from "@prisma/client";
import type {
  CategoryRepositoryPort,
  CategoryRecord,
  BrandRepositoryPort,
  BrandRecord,
  ManufacturerRepositoryPort,
  ManufacturerRecord,
  ReferenceDataSearchCriteria,
  ReferenceDataSort,
} from "../../application-kernel";
import type { PageRequest, PageResult } from "../../application-kernel";

function orderBy(sort?: ReferenceDataSort) {
  if (sort === "name-desc") return { name: "desc" as const };
  if (sort === "recent") return { createdAt: "desc" as const };
  return { name: "asc" as const };
}

function paginationArgs(page: PageRequest) {
  return { skip: (page.page - 1) * page.perPage, take: page.perPage };
}

function toPageResult<T>(items: T[], total: number, page: PageRequest): PageResult<T> {
  return {
    items,
    page: page.page,
    perPage: page.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / page.perPage)),
  };
}

/** Implementação real de `CategoryRepositoryPort` sobre Prisma. */
export class PrismaCategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  private toRecord(row: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    parent: { slug: string } | null;
  }): CategoryRecord {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      parentSlug: row.parent?.slug ?? undefined,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listAll(): Promise<CategoryRecord[]> {
    const rows = await this.client.category.findMany({
      include: { parent: true },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => this.toRecord(row));
  }

  async search(
    criteria: ReferenceDataSearchCriteria,
    page: PageRequest,
    sort?: ReferenceDataSort,
  ): Promise<PageResult<CategoryRecord>> {
    const where = {
      active: criteria.includeInactive ? undefined : true,
      name: criteria.search ? { contains: criteria.search } : undefined,
    };
    const [total, rows] = await Promise.all([
      this.client.category.count({ where }),
      this.client.category.findMany({
        where,
        include: { parent: true },
        orderBy: orderBy(sort),
        ...paginationArgs(page),
      }),
    ]);
    return toPageResult(
      rows.map((row) => this.toRecord(row)),
      total,
      page,
    );
  }

  async findById(id: string): Promise<CategoryRecord | null> {
    const row = await this.client.category.findUnique({ where: { id }, include: { parent: true } });
    return row ? this.toRecord(row) : null;
  }

  async findBySlug(slug: string): Promise<CategoryRecord | null> {
    const row = await this.client.category.findUnique({
      where: { slug },
      include: { parent: true },
    });
    return row ? this.toRecord(row) : null;
  }

  async save(record: CategoryRecord): Promise<void> {
    const parent = record.parentSlug
      ? await this.client.category.findUnique({ where: { slug: record.parentSlug } })
      : null;

    await this.client.category.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        slug: record.slug,
        name: record.name,
        description: record.description,
        parentId: parent?.id,
        active: record.active,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      update: {
        name: record.name,
        description: record.description,
        parentId: parent?.id,
        active: record.active,
        updatedAt: record.updatedAt,
      },
    });
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.client.category.update({ where: { id }, data: { active } });
  }
}

/** Implementação real de `BrandRepositoryPort` sobre Prisma. */
export class PrismaBrandRepository implements BrandRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  private toRecord(row: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BrandRecord {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      logoUrl: row.logoUrl ?? undefined,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listAll(): Promise<BrandRecord[]> {
    const rows = await this.client.brand.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => this.toRecord(row));
  }

  async search(
    criteria: ReferenceDataSearchCriteria,
    page: PageRequest,
    sort?: ReferenceDataSort,
  ): Promise<PageResult<BrandRecord>> {
    const where = {
      active: criteria.includeInactive ? undefined : true,
      name: criteria.search ? { contains: criteria.search } : undefined,
    };
    const [total, rows] = await Promise.all([
      this.client.brand.count({ where }),
      this.client.brand.findMany({ where, orderBy: orderBy(sort), ...paginationArgs(page) }),
    ]);
    return toPageResult(
      rows.map((row) => this.toRecord(row)),
      total,
      page,
    );
  }

  async findById(id: string): Promise<BrandRecord | null> {
    const row = await this.client.brand.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findBySlug(slug: string): Promise<BrandRecord | null> {
    const row = await this.client.brand.findUnique({ where: { slug } });
    return row ? this.toRecord(row) : null;
  }

  async save(record: BrandRecord): Promise<void> {
    await this.client.brand.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        slug: record.slug,
        name: record.name,
        logoUrl: record.logoUrl,
        active: record.active,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      update: {
        name: record.name,
        logoUrl: record.logoUrl,
        active: record.active,
        updatedAt: record.updatedAt,
      },
    });
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.client.brand.update({ where: { id }, data: { active } });
  }
}

/** Implementação real de `ManufacturerRepositoryPort` sobre Prisma. `certifications` é `Json` no schema (ver PERSISTENCE_MODEL.md §6) — serializado/desserializado aqui. */
export class PrismaManufacturerRepository implements ManufacturerRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  private toRecord(row: {
    id: string;
    slug: string;
    name: string;
    country: string | null;
    certifications: unknown;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ManufacturerRecord {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      country: row.country ?? undefined,
      certifications: Array.isArray(row.certifications) ? (row.certifications as string[]) : [],
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listAll(): Promise<ManufacturerRecord[]> {
    const rows = await this.client.manufacturer.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => this.toRecord(row));
  }

  async search(
    criteria: ReferenceDataSearchCriteria,
    page: PageRequest,
    sort?: ReferenceDataSort,
  ): Promise<PageResult<ManufacturerRecord>> {
    const where = {
      active: criteria.includeInactive ? undefined : true,
      name: criteria.search ? { contains: criteria.search } : undefined,
    };
    const [total, rows] = await Promise.all([
      this.client.manufacturer.count({ where }),
      this.client.manufacturer.findMany({ where, orderBy: orderBy(sort), ...paginationArgs(page) }),
    ]);
    return toPageResult(
      rows.map((row) => this.toRecord(row)),
      total,
      page,
    );
  }

  async findById(id: string): Promise<ManufacturerRecord | null> {
    const row = await this.client.manufacturer.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findBySlug(slug: string): Promise<ManufacturerRecord | null> {
    const row = await this.client.manufacturer.findUnique({ where: { slug } });
    return row ? this.toRecord(row) : null;
  }

  async save(record: ManufacturerRecord): Promise<void> {
    await this.client.manufacturer.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        slug: record.slug,
        name: record.name,
        country: record.country,
        certifications: [...record.certifications],
        active: record.active,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      update: {
        name: record.name,
        country: record.country,
        certifications: [...record.certifications],
        active: record.active,
        updatedAt: record.updatedAt,
      },
    });
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await this.client.manufacturer.update({ where: { id }, data: { active } });
  }
}
