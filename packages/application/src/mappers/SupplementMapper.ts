import type { SupplementDTO } from "../dto/SupplementDTO";
import type { SupplementRecord } from "../ports/SupplementRepositoryPort";

/** `SupplementRecord` (Port) ↔ `SupplementDTO` (fronteira pública). Tradução quase 1:1 — a diferença real é `Date` → ISO string. */
export const SupplementMapper = {
  toDTO(record: SupplementRecord): SupplementDTO {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      categorySlug: record.categorySlug,
      brandSlug: record.brandSlug,
      attributes: record.attributes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  toDTOList(records: readonly SupplementRecord[]): SupplementDTO[] {
    return records.map(SupplementMapper.toDTO);
  },
};
