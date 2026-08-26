/**
 * Identidade mínima de "um suplemento" para fins de avaliação. Não é o
 * mesmo objeto que `Product` no Prisma (packages/database) — este é um
 * recorte puramente do domínio de cálculo, sem colunas de persistência,
 * imagens, SEO, etc. Deliberadamente sem campos específicos de categoria:
 * "creatina" não aparece em lugar nenhum do Core Domain.
 */
export class SupplementProfile {
  private constructor(
    public readonly id: string,
    public readonly categorySlug: string,
    public readonly brandSlug: string,
  ) {}

  static of(id: string, categorySlug: string, brandSlug: string): SupplementProfile {
    if (!id.trim() || !categorySlug.trim() || !brandSlug.trim()) {
      throw new Error("SupplementProfile requer id, categorySlug e brandSlug não vazios.");
    }
    return new SupplementProfile(id, categorySlug, brandSlug);
  }

  belongsToCategory(categorySlug: string): boolean {
    return this.categorySlug === categorySlug;
  }
}
