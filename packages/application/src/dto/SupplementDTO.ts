export type ProductStatusDTO = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";

/**
 * Forma pública de "um suplemento" fora da Application Layer. Mais rica
 * que `SupplementProfile` do Domain (que só carrega id/categorySlug/
 * brandSlug — o mínimo para calcular um Índice): aqui vivem nome, slug,
 * status e atributos, que são conceitos de catálogo/aplicação, não de
 * cálculo.
 */
export interface SupplementDTO {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly categorySlug: string;
  readonly brandSlug: string;
  readonly manufacturerSlug?: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly status: ProductStatusDTO;
  readonly createdAt: string; // ISO 8601 — DTOs nunca carregam `Date` para fora, para não presumir fuso/serialização de quem consome.
  readonly updatedAt: string;
}
