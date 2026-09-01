import type { PrismaClient } from "@prisma/client";
import type { SkuRepositoryPort, SkuRecord } from "../../application-kernel";
import type { PageRequest, PageResult } from "../../application-kernel";

type SkuRow = {
  id: string;
  productId: string;
  gtin: string | null;
  variantLabel: string;
  servingsPerUnit: number | null;
  dosagePerServing: number | null;
  status: string;
  successorSkuId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Implementação real de `SkuRepositoryPort` sobre Prisma. */
export class PrismaSkuRepository implements SkuRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  private toRecord(row: SkuRow): SkuRecord {
    return {
      id: row.id,
      productId: row.productId,
      gtin: row.gtin ?? undefined,
      variantLabel: row.variantLabel,
      servingsPerUnit: row.servingsPerUnit ?? undefined,
      dosagePerServing: row.dosagePerServing ?? undefined,
      status: row.status as SkuRecord["status"],
      successorSkuId: row.successorSkuId ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(id: string): Promise<SkuRecord | null> {
    const row = await this.client.sku.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findByGtin(gtin: string): Promise<SkuRecord | null> {
    const row = await this.client.sku.findUnique({ where: { gtin } });
    return row ? this.toRecord(row) : null;
  }

  async listByProduct(productId: string, page: PageRequest): Promise<PageResult<SkuRecord>> {
    const where = { productId };
    const [total, rows] = await Promise.all([
      this.client.sku.count({ where }),
      this.client.sku.findMany({
        where,
        orderBy: { createdAt: "asc" },
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

  async save(record: SkuRecord): Promise<void> {
    await this.client.sku.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        productId: record.productId,
        gtin: record.gtin,
        variantLabel: record.variantLabel,
        servingsPerUnit: record.servingsPerUnit,
        dosagePerServing: record.dosagePerServing,
        status: record.status,
        successorSkuId: record.successorSkuId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      update: {
        gtin: record.gtin,
        variantLabel: record.variantLabel,
        servingsPerUnit: record.servingsPerUnit,
        dosagePerServing: record.dosagePerServing,
        status: record.status,
        successorSkuId: record.successorSkuId,
        updatedAt: record.updatedAt,
      },
    });
  }

  async setStatus(id: string, status: SkuRecord["status"]): Promise<void> {
    await this.client.sku.update({ where: { id }, data: { status } });
  }
}
