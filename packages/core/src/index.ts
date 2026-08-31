// SupleCheck Core Domain — motor de cálculo do Índice SupleCheck.
// Camada 100% livre de framework: sem React, sem Next.js, sem Prisma.
// Ver packages/core/ARCHITECTURE.md para a documentação completa.

// Value Objects
export { Score } from "./domain/value-objects/Score";
export { Weight } from "./domain/value-objects/Weight";
export { Money } from "./domain/value-objects/Money";
export { CriterionId } from "./domain/value-objects/CriterionId";
export { MethodologyVersion } from "./domain/value-objects/MethodologyVersion";
export { TechnicalNote, ValidationFlag } from "./domain/value-objects/TechnicalNote";

// Enums
export {
  EvidenceQuality,
  ValidationSeverity,
  CriterionStatus,
  CriterionKind,
} from "./domain/enums/EvidenceQuality";

// Entities
export { SupplementProfile } from "./domain/entities/SupplementProfile";

// Evaluation (fatos de entrada)
export { EvaluationContext } from "./domain/evaluation/EvaluationContext";
export { EvaluationContextBuilder } from "./domain/evaluation/EvaluationContextBuilder";
export { FactKeys } from "./domain/evaluation/Facts";
export type {
  FactKey,
  NumericRange,
  CompositionFacts,
  PricingFacts,
  LabelFacts,
  ReputationFacts,
  MarketingClaimsFacts,
  StoreFacts,
} from "./domain/evaluation/Facts";

// Critérios
export type {
  Criterion,
  CriterionMetadata,
  CriterionEvaluationResult,
} from "./domain/criteria/Criterion";
export { appliesToCategory } from "./domain/criteria/Criterion";
export { CompositeCriterion, type CompositeChild } from "./domain/criteria/CompositeCriterion";
export { CriterionRegistry } from "./domain/criteria/CriterionRegistry";
export {
  builtInCriteria,
  CostBenefitCriterion,
  PricePerDoseCriterion,
  LabelTransparencyCriterion,
  ReputationCriterion,
  ExaggeratedClaimsCriterion,
  StoreReliabilityCriterion,
} from "./domain/criteria/builtin";

// Classificação
export { ClassificationBand } from "./domain/classification/ClassificationBand";
export { ClassificationSystem } from "./domain/classification/ClassificationSystem";

// Metodologia
export { Methodology, defaultAggregation } from "./domain/methodology/Methodology";
export { MethodologyBuilder } from "./domain/methodology/MethodologyBuilder";
export { CriterionAssignment } from "./domain/methodology/CriterionAssignment";
export { CategoryOverride } from "./domain/methodology/CategoryOverride";
export {
  MethodologyResolver,
  type ResolvedMethodology,
} from "./domain/methodology/MethodologyResolver";
export { WeightNormalizer, type WeightedCriterionRef } from "./domain/methodology/WeightNormalizer";

// Cálculo / Scoring
export {
  WeightedAverageAggregationStrategy,
  WorstCriterionCappedAggregationStrategy,
  type AggregationStrategy,
  type WeightedScore,
} from "./domain/scoring/AggregationStrategy";
export { ScoringEngine } from "./domain/scoring/ScoringEngine";
export {
  SupleCheckIndexResult,
  type CriterionBreakdownEntry,
} from "./domain/scoring/SupleCheckIndexResult";

// Erros de domínio
export * from "./domain/errors/DomainError";

// Result (utilitário compartilhado)
export { ok, err, isOk, unwrap, type Result } from "./domain/shared/Result";

// Nenhuma camada de aplicação vive aqui. `packages/core` é só Domain —
// casos de uso, DTOs, Ports e orquestração vivem em `packages/application`,
// que depende deste pacote (nunca o contrário). Ver
// packages/application/ARCHITECTURE.md.
