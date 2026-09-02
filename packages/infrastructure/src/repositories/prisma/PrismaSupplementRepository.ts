import type { PrismaClient } from "@prisma/client";
import type {
  SupplementRepositoryPort,
  SupplementRecord,
  SupplementSearchCriteria,
  SupplementSort,
} from "../../application-kernel";
import type { PageRequest, PageResult } from "../../application-kernel";

function orderBy(sort?: SupplementSort) {
  if (sort === "name-desc") return { name: "desc" as const };
  if (sort === "recent") return { createdAt: "desc" as const };
  return { name: "asc" as const };
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  attributes: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  category: { slug: string };
  brand: { slug: string };
  manufacturer: { slug: string } | null;
};

/**
 * Implementação real de `SupplementRepositoryPort` sobre Prisma —
 * "Product" no schema físico (`prisma/schema.prisma`), "Suplemento" na
 * linguagem de negócio (Domain Model §2.1). Resolve slug↔id de
 * categoria/marca/fabricante em `save`, e o inverso via `include` em
 * toda leitura — a Application Layer nunca vê um id técnico de FK.
 */
export class PrismaSupplementRepository implements SupplementRepositoryPort {
  private readonly include = { category: true, brand: true, manufacturer: true } as const;

  constructor(private readonly client: PrismaClient) {}

  private toRecord(row: ProductRow): SupplementRecord {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      categorySlug: row.category.slug,
      brandSlug: row.brand.slug,
      manufacturerSlug: row.manufacturer?.slug ?? undefined,
      attributes: (row.attributes as Record<string, unknown>) ?? {},
      status: row.status as SupplementRecord["status"],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(id: string): Promise<SupplementRecord | null> {
    const row = await this.client.product.findUnique({ where: { id }, include: this.include });
    return row ? this.toRecord(row) : null;
  }

  async findBySlug(slug: string): Promise<SupplementRecord | null> {
    const row = await this.client.product.findUnique({ where: { slug }, include: this.include });
    return row ? this.toRecord(row) : null;
  }

  async findManyByIds(ids: readonly string[]): Promise<SupplementRecord[]> {
    if (ids.length === 0) return [];
    const rows = await this.client.product.findMany({
      where: { id: { in: [...ids] } },
      include: this.include,
    });
    return rows.map((row) => this.toRecord(row));
  }

  async search(
    criteria: SupplementSearchCriteria,
    page: PageRequest,
    sort?: SupplementSort,
  ): Promise<PageResult<SupplementRecord>> {
    const where = {
      status: criteria.status,
      category: criteria.categorySlug ? { slug: criteria.categorySlug } : undefined,
      brand: criteria.brandSlug ? { slug: criteria.brandSlug } : undefined,
      name: criteria.search
        ? { contains: criteria.search, mode: "insensitive" as const }
        : undefined,
    };

    const [total, rows] = await Promise.all([
      this.client.product.count({ where }),
      this.client.product.findMany({
        where,
        include: this.include,
        orderBy: orderBy(sort),
        skip: (page.page - 1) * page.perPage,
        take: page.perPage,
      }),
    ]);

    return {
      items: rows.map((row) => this.toRecord(row)),
      page: page.page,
      perPage: page.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / page.perPage)),
    };
  }

  async save(record: SupplementRecord): Promise<void> {
    const [category, brand, manufacturer] = await Promise.all([
      this.client.category.findUniqueOrThrow({ where: { slug: record.categorySlug } }),
      this.client.brand.findUniqueOrThrow({ where: { slug: record.brandSlug } }),
      record.manufacturerSlug
        ? this.client.manufacturer.findUnique({ where: { slug: record.manufacturerSlug } })
        : Promise.resolve(null),
    ]);

    await this.client.product.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        slug: record.slug,
        name: record.name,
        description: record.description,
        categoryId: category.id,
        brandId: brand.id,
        manufacturerId: manufacturer?.id,
        attributes: record.attributes as object,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      update: {
        name: record.name,
        description: record.description,
        categoryId: category.id,
        brandId: brand.id,
        manufacturerId: manufacturer?.id,
        attributes: record.attributes as object,
        status: record.status,
        updatedAt: record.updatedAt,
      },
    });
  }

  async setStatus(id: string, status: SupplementRecord["status"]): Promise<void> {
    await this.client.product.update({ where: { id }, data: { status } });
  }
}
