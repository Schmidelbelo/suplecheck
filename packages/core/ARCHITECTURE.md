# SupleCheck Core Domain — Arquitetura

> Este documento descreve `packages/core`, o motor de cálculo do Índice
> SupleCheck. É a camada mais interna da plataforma: zero dependência de
> React, Next.js, Prisma ou qualquer framework. Se este pacote fosse
> extraído para um repositório separado amanhã, ele continuaria
> compilando e funcionando sozinho.
>
> Ver [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) para a arquitetura
> da plataforma como um todo — este documento detalha apenas
> `packages/core`.

## 1. Por que este pacote existe

Toda plataforma de comparação acaba, cedo ou tarde, hardcodando a lógica
de pontuação dentro de uma página ou de uma rota de API — e então fica
presa a ela. O objetivo deste pacote é o oposto: um motor que **não sabe
o que é "creatina"**, não sabe o que é um `Product` do Prisma, e não sabe
que existe uma página `/ranking`. Ele sabe apenas uma coisa: como
transformar _fatos sobre um suplemento_ em uma _nota_, segundo uma
_metodologia configurável_.

Isso é o que permite, no futuro, avaliar whey, pré-treino ou qualquer
categoria nova **sem tocar em uma linha deste pacote** — apenas
compondo novos critérios e novas metodologias.

## 2. Camadas (Clean Architecture)

```
packages/core/src/
└── domain/            ← regras de negócio puras. Todo o pacote É esta camada.
    ├── value-objects/  Score, Weight, Money, CriterionId, MethodologyVersion, TechnicalNote, ValidationFlag
    ├── enums/           EvidenceQuality, ValidationSeverity, CriterionStatus, CriterionKind
    ├── entities/         SupplementProfile
    ├── evaluation/        EvaluationContext, EvaluationContextBuilder, Facts (fatos conhecidos)
    ├── criteria/           Criterion (contrato), CompositeCriterion, CriterionRegistry, builtin/*
    ├── classification/     ClassificationBand, ClassificationSystem
    ├── methodology/        Methodology, MethodologyBuilder, MethodologyResolver, CategoryOverride, WeightNormalizer
    ├── scoring/             AggregationStrategy, ScoringEngine, SupleCheckIndexResult
    ├── shared/                Result<T, E>
    └── errors/                 DomainError e subclasses
```

> **Atualização:** a camada de aplicação (casos de uso, DTOs, Ports,
> mappers, policies) que originalmente vivia em `packages/core/src/application`
> foi extraída para o pacote próprio `packages/application`, que depende
> deste pacote (nunca o contrário). Ver
> [`../application/ARCHITECTURE.md`](../application/ARCHITECTURE.md).
> `packages/core` agora é exclusivamente Domain — nenhum Use Case, Port
> ou DTO vive aqui.

Regra de dependência: **`packages/core` nunca importa `packages/application`**
(nem sabe que ele existe). `packages/application` depende de
`packages/core` através de um único ponto de acoplamento
(`packages/application/src/domain-kernel.ts`) — isso é o que separa
"regra de negócio" de "orquestração", e o que permite auditar a direção
da dependência com um grep em vez de só uma convenção de code review.

## 3. Vocabulário do domínio (DDD)

| Conceito                  | O que é                                                                                                   | Onde vive                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Criterion**             | Uma regra que transforma fatos em uma nota 0–100 para um aspecto específico (preço, rótulo, reputação...) | `domain/criteria/Criterion.ts` (interface)      |
| **CriterionRegistry**     | Catálogo de critérios disponíveis + seu status (ativo/desativado/depreciado)                              | `domain/criteria/CriterionRegistry.ts`          |
| **EvaluationContext**     | Os fatos sobre um suplemento específico, usados por critérios para calcular sua nota                      | `domain/evaluation/EvaluationContext.ts`        |
| **Methodology**           | Um conjunto versionado de critérios + pesos + estratégia de agregação + sistema de classificação          | `domain/methodology/Methodology.ts`             |
| **CategoryOverride**      | Ajuste de uma metodologia para uma categoria específica (desativar/reponderar critérios)                  | `domain/methodology/CategoryOverride.ts`        |
| **AggregationStrategy**   | Como notas ponderadas viram uma nota final (padrão: média ponderada)                                      | `domain/scoring/AggregationStrategy.ts`         |
| **ScoringEngine**         | Orquestra: roda critérios → agrega → classifica                                                           | `domain/scoring/ScoringEngine.ts`               |
| **SupleCheckIndexResult** | O resultado imutável e versionado de um cálculo                                                           | `domain/scoring/SupleCheckIndexResult.ts`       |
| **ClassificationSystem**  | Traduz uma nota final em um rótulo ("Excelente", "Bom"...)                                                | `domain/classification/ClassificationSystem.ts` |

## 4. O fluxo de cálculo, passo a passo

Chamado por `CalculateIndexUseCase` (`packages/application`), mas os
dois passos abaixo são só Domain — reproduzíveis sem nenhuma camada por
cima, como o smoke test deste pacote faz:

```
MethodologyResolver.resolve(methodology, supplement.categorySlug)
        │  aplica CategoryOverride (se existir) → desativa/repondera critérios
        │  renormaliza pesos via WeightNormalizer (voltam a somar 1)
        ▼
   ResolvedMethodology { criteria: [{criterionId, weight}], classification, aggregation }
        │
        ▼
ScoringEngine.calculate(supplementId, resolved, context)
        │  para cada {criterionId, weight}:
        │     criterion = registry.get(criterionId)
        │     result = criterion.evaluate(context)   ← aqui mora toda regra específica
        │  aggregation.aggregate(scores ponderados) → nota final
        │  classification.classify(nota final) → faixa/rótulo
        ▼
   SupleCheckIndexResult (imutável, referencia methodologyVersion, calculatedAt)
```

O `ScoringEngine` é deliberadamente "burro" — ele não conhece nenhum
critério específico, nenhuma categoria, nenhuma regra de negócio. Toda
inteligência vive nos critérios e na metodologia, que são dados/estratégias
injetadas, não código do motor.

## 5. Extensibilidade — como cada requisito foi resolvido

| Requisito                                | Mecanismo                                                                                       | Por quê funciona sem alterar código existente                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Adicionar critério novo                  | Implementar a interface `Criterion` e chamar `registry.register(novoCriterio)`                  | O motor só conhece a interface (Strategy Pattern), nunca uma implementação concreta                            |
| Alterar pesos                            | `Methodology.revise({ assignments: [...] })`                                                    | Produz uma nova versão imutável; a antiga continua existindo para resultados já calculados                     |
| Criar nova metodologia                   | `MethodologyBuilder` ou `CreateMethodologyUseCase`                                              | Composição de dados, não uma nova classe/arquivo                                                               |
| Versionar metodologia                    | `MethodologyVersion` (semver) + `Methodology.revise()`                                          | Nunca há mutação — cada revisão é uma instância nova, com `MethodologyVersion` incrementada                    |
| Regras por categoria                     | `CategoryOverride` + `MethodologyResolver`                                                      | A metodologia base não sabe que overrides existem; a resolução é uma etapa isolada                             |
| Desativar critério                       | `CriterionRegistry.disable(id)` (global) ou `CategoryOverride.disabledCriteria` (por categoria) | O `ScoringEngine` só vê critérios que sobreviveram à resolução — nunca precisa de um `if` para pular algo      |
| Critério composto                        | `CompositeCriterion` implementa a mesma interface `Criterion` (Composite Pattern)               | Motor e registro tratam um critério composto exatamente como um simples                                        |
| Validações / observações técnicas        | `ValidationFlag` e `TechnicalNote` em todo `CriterionEvaluationResult`                          | Todo critério pode anexar alertas e explicações sem precisar de um canal separado                              |
| Nova estratégia de avaliação (agregação) | Implementar `AggregationStrategy`                                                               | Ver `WorstCriterionCappedAggregationStrategy` — implementada só para provar o ponto, sem tocar `ScoringEngine` |
| Nova classificação                       | `ClassificationSystem.of([...bands])`                                                           | Substituível por completo por metodologia; `ClassificationSystem.default()` é só um ponto de partida           |

### Exemplo: adicionar um critério do zero (nenhum arquivo existente é alterado)

```ts
class SustainabilityCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("sustainability"),
    name: "Sustentabilidade da embalagem",
    description: "Recicabilidade e origem da embalagem do produto.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const facts = context.get<{ recyclablePackaging: boolean }>("packaging");
    const score = facts?.recyclablePackaging ? Score.max() : Score.fromRatio(0.4);
    return { criterionId: this.metadata.id, score, notes: [], flags: [] };
  }
}

registry.register(new SustainabilityCriterion());
// e então incluir "sustainability" com um peso em uma nova versão de Methodology.
```

Nenhuma classe do motor, do registro ou da metodologia precisou mudar.

## 6. Princípios aplicados

- **SRP** — cada classe tem um único motivo para mudar: `ScoringEngine` muda só se a orquestração do cálculo mudar; um `Criterion` muda só se sua regra específica mudar; `ClassificationSystem` muda só se as faixas mudarem.
- **OCP** — `CriterionRegistry`, `AggregationStrategy` e `ClassificationSystem` são todos pontos de extensão por composição/implementação de interface, nunca por edição de switch/if existente.
- **LSP** — `CompositeCriterion` é substituível em qualquer lugar que espera `Criterion`; qualquer `AggregationStrategy` é substituível em `ScoringEngine` e em `CompositeCriterion`.
- **ISP** — `Criterion` expõe só `metadata` + `evaluate()`; nada de métodos que só fazem sentido para alguns critérios.
- **DIP** — `ScoringEngine` e `CalculateSupplementIndexUseCase` dependem de `CriterionRegistry`/`Criterion` (abstrações), nunca de uma implementação concreta de critério.
- **Value Objects imutáveis** — `Score`, `Weight`, `Money`, `MethodologyVersion`, `CriterionId` nunca existem em estado inválido (validação no construtor estático `of()`).
- **Entidades com invariantes reais** — `Methodology.of()` rejeita pesos que não somam 1 e critérios duplicados; não é um DTO anêmico.
- **Result vs. exceção** — erro de _configuração_ (peso errado, critério duplicado) lança `DomainError`; ausência de _dado_ de avaliação (ex: preço não informado) não lança — o critério retorna nota neutra + `ValidationFlag` crítico, porque um cálculo com dado incompleto ainda é uma decisão de produto, não um bug.

## 7. Autoauditoria

Executada ao final desta etapa, com resultado registrado aqui para rastreabilidade.

**Duplicação de lógica.** Nenhuma regra de cálculo aparece em dois
lugares. `WeightNormalizer` é usado tanto por `MethodologyResolver`
quanto seria reutilizável por `CompositeCriterion` caso este precisasse
renormalizar (hoje não precisa, pois exige soma=1 na criação). Os seis
critérios embutidos não compartilham lógica entre si além dos Value
Objects — cada um materializa uma regra de negócio distinta.

**Acoplamento.** Verificado via grep: nenhum arquivo neste pacote importa
`packages/application`. `domain/criteria/` não importa de `domain/methodology/`
(only `scoring/AggregationStrategy`, uma interface, para `CompositeCriterion`).
`ScoringEngine` depende de `CriterionRegistry` e `ResolvedMethodology`
(abstrações), nunca de um critério concreto. Os 6 critérios embutidos
dependem apenas de `Criterion`, dos Value Objects e de `evaluation/Facts`
— nunca uns dos outros.

**Responsabilidades.** `ScoringEngine` não decide pesos (isso é
`Methodology`/`MethodologyResolver`). `MethodologyResolver` não calcula
notas (isso é `ScoringEngine` + `Criterion`). Nenhum critério sabe o que é
uma "categoria" — quem lida com categoria é exclusivamente
`CategoryOverride` e `MethodologyResolver`.

**Extensibilidade.** Validada no smoke test (`scripts/smoke.ts`, 17
cenários, todos passando): registro de critério novo, metodologia
inválida rejeitada na criação, critério desconhecido rejeitado só no
cálculo (não na criação da metodologia — permite compor metodologias
antes de todos os critérios existirem), override de categoria com
renormalização de peso, versionamento imutável (`revise()` não muta o
original), critério composto tratado como um critério qualquer, e
sistema de classificação substituível por completo.

**"Plataforma, não ranking de creatina".** Busca por `creatina`/`creatine`
em `packages/core/src` não retorna nenhuma ocorrência em código — só em
comentários ilustrativos (exemplos de uso). Nenhum tipo, enum ou campo do
domínio referencia uma categoria específica. `SupplementProfile` guarda
`categorySlug` como `string` livre, não um enum fechado de categorias.

## 8. O que este pacote deliberadamente NÃO faz

- **Não persiste nada.** `SupleCheckIndexResult` é um objeto de memória;
  gravá-lo como um `ProductScore` do Prisma é responsabilidade de uma
  futura camada de infraestrutura (fora deste pacote).
- **Não busca dados.** `EvaluationContext` é construído por quem chama o
  domínio; o Core Domain não sabe de onde vêm os fatos (rótulo, preço,
  reviews).
- **Não expõe API HTTP nem UI.** Consumido via `CalculateSupplementIndexUseCase`
  e `CreateMethodologyUseCase`, que uma futura rota de API ou Server Action
  vai chamar.
- **Não decide a metodologia "atual" de uma categoria.** Isso é uma
  decisão de aplicação/infraestrutura (ex: "qual `Methodology` usar para
  a categoria X hoje") — o domínio só sabe calcular dado uma metodologia
  específica.

## 9. Como validar este pacote isoladamente

```bash
npx tsc -p packages/core/tsconfig.json --noEmit   # typecheck
npx eslint packages/core/src                       # lint
npx tsx packages/core/scripts/smoke.ts              # cenário end-to-end
```

Nenhum dos três comandos depende do restante do monorepo — reforçando que
este pacote é, de fato, independente.
