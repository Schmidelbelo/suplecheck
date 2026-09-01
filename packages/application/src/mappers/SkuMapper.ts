import type { SkuDTO } from "../dto/SkuDTO";
import type { SkuRecord } from "../ports/SkuRepositoryPort";

export const SkuMapper = {
  toDTO(record: SkuRecord): SkuDTO {
    return {
      id: record.id,
      productId: record.productId,
      gtin: record.gtin,
      variantLabel: record.variantLabel,
      servingsPerUnit: record.servingsPerUnit,
      dosagePerServing: record.dosagePerServing,
      status: record.status,
      successorSkuId: record.successorSkuId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },
  toDTOList(records: readonly SkuRecord[]): SkuDTO[] {
    return records.map(SkuMapper.toDTO);
  },
};
