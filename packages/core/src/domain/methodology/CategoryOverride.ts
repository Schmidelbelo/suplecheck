import type { CriterionId } from "../value-objects/CriterionId";
import type { Weight } from "../value-objects/Weight";
import type { ClassificationSystem } from "../classification/ClassificationSystem";

/**
 * Ajuste de uma `Methodology` para uma categoria específica de suplemento
 * (ex: "para pré-treino, desative 'transparência de dosagem tradicional'
 * e use pesos X"). Fica de fora da `Methodology` base para que a fórmula
 * geral continue sendo o caso comum, e exceções por categoria sejam
 * explícitas e localizadas — sem precisar de uma metodologia inteira
 * duplicada por categoria.
 */
export class CategoryOverride {
  private constructor(
    public readonly categorySlug: string,
    public readonly disabledCriteria: readonly CriterionId[],
    public readonly weightOverrides: ReadonlyMap<string, Weight>,
    public readonly classification?: ClassificationSystem,
  ) {}

  static of(
    categorySlug: string,
    options: {
      disabledCriteria?: readonly CriterionId[];
      weightOverrides?: ReadonlyMap<string, Weight>;
      classification?: ClassificationSystem;
    } = {},
  ): CategoryOverride {
    if (!categorySlug.trim()) {
      throw new Error("CategoryOverride requer categorySlug não vazio.");
    }
    return new CategoryOverride(
      categorySlug,
      options.disabledCriteria ?? [],
      options.weightOverrides ?? new Map(),
      options.classification,
    );
  }

  disables(criterionId: CriterionId): boolean {
    return this.disabledCriteria.some((id) => id.equals(criterionId));
  }

  weightOverrideFor(criterionId: CriterionId): Weight | undefined {
    return this.weightOverrides.get(criterionId.value);
  }
}
