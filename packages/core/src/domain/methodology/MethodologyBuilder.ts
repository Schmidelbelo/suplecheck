import { Methodology, defaultAggregation } from "./Methodology";
import { CriterionAssignment } from "./CriterionAssignment";
import type { CategoryOverride } from "./CategoryOverride";
import { CriterionId } from "../value-objects/CriterionId";
import { Weight } from "../value-objects/Weight";
import { MethodologyVersion } from "../value-objects/MethodologyVersion";
import { ClassificationSystem } from "../classification/ClassificationSystem";
import type { AggregationStrategy } from "../scoring/AggregationStrategy";
import type { Result } from "../shared/Result";
import { ok, err } from "../shared/Result";

/**
 * Forma recomendada de compor uma `Methodology` nova (ex: a metodologia
 * "creatina v1" ou uma futura "pré-treino v1") sem alterar nenhum código
 * existente — apenas chamando o builder com os critérios e pesos
 * desejados. `tryBuild()` devolve um `Result` em vez de lançar, para uso
 * em contextos (ex: um futuro painel admin) que preferem validar antes
 * de decidir o que fazer com o erro.
 */
export class MethodologyBuilder {
  private id?: string;
  private name?: string;
  private version: MethodologyVersion = MethodologyVersion.initial();
  private readonly assignments: CriterionAssignment[] = [];
  private classification: ClassificationSystem = ClassificationSystem.default();
  private aggregation: AggregationStrategy = defaultAggregation();
  private readonly categoryOverrides = new Map<string, CategoryOverride>();

  static create(): MethodologyBuilder {
    return new MethodologyBuilder();
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withVersion(version: MethodologyVersion): this {
    this.version = version;
    return this;
  }

  addCriterion(criterionId: string, weight: number, enabled = true): this {
    this.assignments.push(
      CriterionAssignment.of(CriterionId.of(criterionId), Weight.of(weight), enabled),
    );
    return this;
  }

  withClassification(classification: ClassificationSystem): this {
    this.classification = classification;
    return this;
  }

  withAggregation(strategy: AggregationStrategy): this {
    this.aggregation = strategy;
    return this;
  }

  withCategoryOverride(override: CategoryOverride): this {
    this.categoryOverrides.set(override.categorySlug, override);
    return this;
  }

  /** Redistribui os pesos informados proporcionalmente para que somem exatamente 1. */
  normalizeWeights(): this {
    const total = this.assignments.reduce((sum, a) => sum + a.weight.value, 0);
    if (total === 0) return this;
    for (let i = 0; i < this.assignments.length; i++) {
      const current = this.assignments[i]!;
      this.assignments[i] = current.withWeight(Weight.of(current.weight.value / total));
    }
    return this;
  }

  build(): Methodology {
    if (!this.id || !this.name) {
      throw new Error("MethodologyBuilder requer id e name antes de build().");
    }
    return Methodology.of({
      id: this.id,
      name: this.name,
      version: this.version,
      assignments: this.assignments,
      classification: this.classification,
      aggregation: this.aggregation,
      categoryOverrides: this.categoryOverrides,
    });
  }

  tryBuild(): Result<Methodology> {
    try {
      return ok(this.build());
    } catch (error) {
      return err(error instanceof Error ? error.message : String(error));
    }
  }
}
