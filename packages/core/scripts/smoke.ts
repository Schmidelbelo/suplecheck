/**
 * Smoke test manual do Core Domain — não é a suíte de testes formal
 * (fica para uma etapa futura com um test runner), mas exercita o motor
 * ponta a ponta com um cenário realista para provar que o domínio
 * calcula, versiona, resolve overrides de categoria e reporta erros
 * corretamente. Rodar com: npx tsx packages/core/scripts/smoke.ts
 */
import {
  builtInCriteria,
  CriterionRegistry,
  MethodologyBuilder,
  MethodologyResolver,
  ScoringEngine,
  type Methodology,
  SupplementProfile,
  EvaluationContextBuilder,
  CategoryOverride,
  CriterionId,
  Weight,
  DuplicateCriterionError,
  UnknownCriterionError,
  WeightSumMismatchError,
  CompositeCriterion,
  CriterionKind,
  Score,
  ClassificationSystem,
  ClassificationBand,
} from "../src/index";

/**
 * Este smoke test exercita só o Domain (chamando `MethodologyResolver` +
 * `ScoringEngine` diretamente) — a orquestração via caso de uso
 * (`CalculateIndexUseCase`) agora vive em `packages/application`, com o
 * seu próprio smoke test (`packages/application/scripts/smoke.ts`).
 */
function calculate(supplement: SupplementProfile, methodology: Methodology) {
  const resolved = MethodologyResolver.resolve(methodology, supplement.categorySlug);
  return new ScoringEngine(registry).calculate(supplement.id, resolved, context);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FALHOU: ${message}`);
  }
  console.warn(`OK  ${message}`);
}

// 1. Registro de critérios embutidos + verificação de OCP (duplicado deve falhar)
const registry = new CriterionRegistry();
for (const criterion of builtInCriteria()) registry.register(criterion);
assert(registry.listActive().length === 6, "6 critérios embutidos registrados e ativos");

try {
  registry.register(builtInCriteria()[0]!);
  assert(false, "registrar critério duplicado deveria lançar DuplicateCriterionError");
} catch (error) {
  assert(
    error instanceof DuplicateCriterionError,
    "DuplicateCriterionError lançado ao duplicar critério",
  );
}

// 2. Metodologia "creatina v1" — pesos somando 1
const methodology = MethodologyBuilder.create()
  .withId("creatina")
  .withName("Metodologia Creatina")
  .addCriterion("cost-benefit", 0.25)
  .addCriterion("price-per-dose", 0.15)
  .addCriterion("label-transparency", 0.25)
  .addCriterion("reputation", 0.15)
  .addCriterion("exaggerated-claims", 0.1)
  .addCriterion("store-reliability", 0.1)
  .withCategoryOverride(
    CategoryOverride.of("pre-treino", {
      disabledCriteria: [CriterionId.of("exaggerated-claims")],
    }),
  )
  .build();

assert(methodology.version.toString() === "1.0.0", "metodologia nasce na versão 1.0.0");

// 3. Contexto de avaliação realista
const context = new EvaluationContextBuilder()
  .withComposition({
    activeIngredientAmountPerServing: 5000,
    referenceRangePerServing: { min: 3000, max: 5000 },
    additives: [],
    undisclosedSubstances: [],
  })
  .withPricing({
    priceInCents: 8990,
    dosesPerUnit: 60,
    categoryAveragePricePerDoseInCents: 180,
  })
  .withLabel({
    hasProprietaryBlend: false,
    nutritionalInfoComplete: true,
    dosageClearlyStated: true,
  })
  .withReputation({ averageRating: 4.6, reviewCount: 340 })
  .withMarketingClaims({
    claims: ["aumenta força", "melhora performance", "cura todas as doenças"],
    scientificallySupportedClaims: ["aumenta força", "melhora performance"],
  })
  .withStore({ trustScore: 88, hasBuyerProtection: true })
  .build();

const supplement = SupplementProfile.of("prod_123", "creatina", "brand_xyz");
const result = calculate(supplement, methodology);

assert(result.finalScore.value > 0 && result.finalScore.value <= 100, "nota final dentro de 0–100");
assert(result.breakdown.length === 6, "breakdown contém os 6 critérios avaliados");
const weightSum = result.breakdown.reduce((sum, entry) => sum + entry.weight.value, 0);
assert(Math.abs(weightSum - 1) < 1e-6, "pesos do breakdown somam 1 (100%)");
assert(
  result.methodologyVersion.toString() === "1.0.0",
  "resultado referencia a versão exata da metodologia",
);
console.warn(
  `    -> Índice final: ${result.finalScore.toString()} (${result.classification.label})`,
);

// 4. Override de categoria: desativa um critério e RENORMALIZA os pesos (não perde peso)
const preTreinoResult = calculate(
  SupplementProfile.of("prod_456", "pre-treino", "brand_xyz"),
  methodology,
);
assert(
  preTreinoResult.breakdown.length === 5,
  "override de categoria desativa 1 critério (5 restantes)",
);
const preTreinoWeightSum = preTreinoResult.breakdown.reduce((sum, e) => sum + e.weight.value, 0);
assert(
  Math.abs(preTreinoWeightSum - 1) < 1e-6,
  "pesos renormalizados continuam somando 1 após override",
);

// 5. Metodologia inválida: soma de pesos != 1 deve falhar na construção
try {
  MethodologyBuilder.create()
    .withId("invalida")
    .withName("Inválida")
    .addCriterion("cost-benefit", 0.5)
    .addCriterion("reputation", 0.2)
    .build();
  assert(false, "metodologia com pesos somando 0.7 deveria lançar WeightSumMismatchError");
} catch (error) {
  assert(
    error instanceof WeightSumMismatchError,
    "WeightSumMismatchError lançado quando pesos não somam 1",
  );
}

// 6. Critério desconhecido referenciado por uma metodologia deve falhar só no cálculo (não na criação da metodologia)
const methodologyWithUnknownCriterion = MethodologyBuilder.create()
  .withId("quebrada")
  .withName("Quebrada")
  .addCriterion("criterio-que-nao-existe", 1)
  .build();
try {
  calculate(supplement, methodologyWithUnknownCriterion);
  assert(false, "critério inexistente deveria lançar UnknownCriterionError no cálculo");
} catch (error) {
  assert(
    error instanceof UnknownCriterionError,
    "UnknownCriterionError lançado ao calcular com critério não registrado",
  );
}

// 7. Versionamento: revisar a metodologia produz uma NOVA versão, sem mutar a original
const revised = methodology.revise(
  {
    assignments: methodology.assignments.map((a) =>
      a.criterionId.value === "reputation" ? a.withWeight(Weight.of(0.15)) : a,
    ),
  },
  "minor",
);
assert(
  methodology.version.toString() === "1.0.0",
  "metodologia original permanece inalterada (imutabilidade)",
);
assert(revised.version.toString() === "1.1.0", "revisão gera versão 1.1.0");

// 8. Critério composto: mesma interface que um critério simples (Composite Pattern)
const composite = CompositeCriterion.of(
  { id: CriterionId.of("composite-demo"), name: "Demo composto", description: "Prova de conceito" },
  [
    { criterion: registry.get(CriterionId.of("label-transparency")), weight: Weight.of(0.5) },
    { criterion: registry.get(CriterionId.of("reputation")), weight: Weight.of(0.5) },
  ],
);
assert(composite.metadata.kind === CriterionKind.COMPOSITE, "critério composto tem kind=COMPOSITE");
const compositeResult = composite.evaluate(context);
assert(
  compositeResult.score.value >= 0 && compositeResult.score.value <= 100,
  "critério composto produz nota válida",
);

// 9. Sistema de classificação totalmente configurável (não hardcoded)
const strictClassification = ClassificationSystem.of([
  ClassificationBand.of("APPROVED", Score.of(90), "Aprovado", "Só o topo passa"),
  ClassificationBand.of("REJECTED", Score.min(), "Reprovado", "Qualquer coisa abaixo de 90"),
]);
const classifiedLow = strictClassification.classify(Score.of(50));
assert(
  classifiedLow.tier === "REJECTED",
  "sistema de classificação customizado é respeitado (não usa o default)",
);

console.warn("\nTodos os cenários do smoke test passaram.");
