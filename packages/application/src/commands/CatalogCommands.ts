export interface CreateCategoryCommand {
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly parentSlug?: string;
}

export interface UpdateCategoryCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly parentSlug?: string;
}

export interface CreateBrandCommand {
  readonly slug: string;
  readonly name: string;
  readonly logoUrl?: string;
}

export interface UpdateBrandCommand {
  readonly id: string;
  readonly name?: string;
  readonly logoUrl?: string;
}

export interface CreateManufacturerCommand {
  readonly slug: string;
  readonly name: string;
  readonly country?: string;
  readonly certifications?: readonly string[];
}

export interface UpdateManufacturerCommand {
  readonly id: string;
  readonly name?: string;
  readonly country?: string;
  readonly certifications?: readonly string[];
}

/** Soft delete — o mesmo comando serve para Categoria/Marca/Fabricante (mesma semântica: `active=false`, nunca remove a linha). */
export interface SetReferenceDataActiveCommand {
  readonly id: string;
  readonly active: boolean;
}
