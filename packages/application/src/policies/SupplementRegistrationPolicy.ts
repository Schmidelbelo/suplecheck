import {
  DuplicateSupplementSlugError,
  CategoryNotFoundError,
  BrandNotFoundError,
} from "../errors/ApplicationError";
import type { SupplementRepositoryPort } from "../ports/SupplementRepositoryPort";
import type { CategoryRepositoryPort, BrandRepositoryPort } from "../ports/CatalogRepositoryPort";

/**
 * Regras de "pode cadastrar este suplemento?" que exigem consultar mais
 * de um repositório — não cabem como invariante de uma única entidade
 * de Domain (que nunca faz I/O), por isso vivem aqui.
 */
export class SupplementRegistrationPolicy {
  constructor(
    private readonly supplements: SupplementRepositoryPort,
    private readonly categories: CategoryRepositoryPort,
    private readonly brands: BrandRepositoryPort,
  ) {}

  async assertCanRegister(input: {
    slug: string;
    categorySlug: string;
    brandSlug: string;
  }): Promise<void> {
    const existing = await this.supplements.findBySlug(input.slug);
    if (existing) throw new DuplicateSupplementSlugError(input.slug);

    const category = await this.categories.findBySlug(input.categorySlug);
    if (!category) throw new CategoryNotFoundError(input.categorySlug);

    const brand = await this.brands.findBySlug(input.brandSlug);
    if (!brand) throw new BrandNotFoundError(input.brandSlug);
  }
}
