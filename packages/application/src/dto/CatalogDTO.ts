export interface CategoryDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly parentSlug?: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BrandDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl?: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ManufacturerDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly country?: string;
  readonly certifications: readonly string[];
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
