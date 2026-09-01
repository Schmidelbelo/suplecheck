import type { CategoryDTO, BrandDTO, ManufacturerDTO } from "../dto/CatalogDTO";
import type {
  CategoryRecord,
  BrandRecord,
  ManufacturerRecord,
} from "../ports/CatalogRepositoryPort";

export const CategoryMapper = {
  toDTO(record: CategoryRecord): CategoryDTO {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      parentSlug: record.parentSlug,
      active: record.active,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },
  toDTOList(records: readonly CategoryRecord[]): CategoryDTO[] {
    return records.map(CategoryMapper.toDTO);
  },
};

export const BrandMapper = {
  toDTO(record: BrandRecord): BrandDTO {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      logoUrl: record.logoUrl,
      active: record.active,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },
  toDTOList(records: readonly BrandRecord[]): BrandDTO[] {
    return records.map(BrandMapper.toDTO);
  },
};

export const ManufacturerMapper = {
  toDTO(record: ManufacturerRecord): ManufacturerDTO {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      country: record.country,
      certifications: record.certifications,
      active: record.active,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },
  toDTOList(records: readonly ManufacturerRecord[]): ManufacturerDTO[] {
    return records.map(ManufacturerMapper.toDTO);
  },
};
