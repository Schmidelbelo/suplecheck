export interface CategoryDTO {
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly parentSlug?: string;
}

export interface BrandDTO {
  readonly slug: string;
  readonly name: string;
  readonly logoUrl?: string;
}
