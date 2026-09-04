# Score Geral, Selos e Explicação Automática

Documentação técnica do algoritmo introduzido na sprint "Inteligência de
Comparação e Ranking". Complementa (não substitui) o Índice SupleScore
já documentado em `/metodologia` e `/como-avaliamos` — o Score Geral é
uma camada **a mais**, que combina o Índice já calculado com sinais de
preço, para responder "qual é a melhor compra", não só "qual produto é
tecnicamente melhor".

## Princípio inegociável: só dado real

Todo fator usado aqui existe de verdade no domínio, é lido de uma coluna
real do banco ou de um critério real da metodologia. **Nada é
estimado, inferido ou proxeado.** Concretamente, isto excluiu
deliberadamente "concentração" e "pureza" do algoritmo — nenhum dado
desse tipo é capturado em lugar nenhum do sistema (a plataforma nunca
testa laboratorialmente um produto) — e excluiu "quantidade de
avaliações" dos fatores usados (existe como fato transitório de entrada
do critério `reputation`, mas não é persistido como número consultável
depois do cálculo, só embutido em texto de nota).

## Fatores usados (100% reais)

| Fator                               | Origem                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Nota dos 6 critérios da metodologia | `ProductScoreCriterionBreakdown` (já persistido)                                                         |
| Índice SupleScore (nota geral)      | `ProductScore.finalScore` (já persistido)                                                                |
| Preço                               | `PriceEntry.priceCents` (última captura)                                                                 |
| Preço por dose                      | `priceCents / servingsPerUnit`                                                                           |
| Preço por grama                     | `priceCents / (servingsPerUnit × dosagePerServing)` — `null` quando o SKU não informa `dosagePerServing` |

## Score Geral — algoritmo

Código: `packages/core/src/domain/scoring/OverallScoreCalculator.ts`.

1. Recebe um **conjunto comparável** de produtos (nunca um produto
   isolado — preço só faz sentido em relação aos demais da mesma
   categoria/ranking).
2. Normaliza preço, preço/dose e preço/grama por **min-max dentro do
   próprio conjunto**: o mais barato do grupo vira 100, o mais caro vira 0. Quando todos os produtos do grupo têm o mesmo valor, todos
   recebem 100 (nenhuma desvantagem relativa entre iguais).
3. Combina os componentes disponíveis por **média ponderada**:

   ```
   Score Geral = (qualidade × peso_qualidade + preço × peso_preço + dose × peso_dose + grama × peso_grama)
                 ÷ (soma dos pesos dos componentes que este produto de fato tem)
   ```

   Um produto sem `pricePerGramCents` (por exemplo) não é penalizado —
   o peso desse componente simplesmente não entra no denominador para
   aquele produto específico, nunca vira um "score fantasma" de zero.

### Pesos (configuráveis, nunca hardcoded no cálculo)

`packages/core/src/domain/scoring/OverallScoreWeights.ts`:

```ts
export const DEFAULT_OVERALL_SCORE_WEIGHTS = {
  quality: 0.4, // Índice SupleScore
  price: 0.2, // preço absoluto
  pricePerDose: 0.25, // preço por dose
  pricePerGram: 0.15, // preço por grama
};
```

Para usar outra ponderação, passe um objeto diferente como segundo
argumento de `calculateOverallScores(inputs, weights)` — a lógica de
cálculo nunca precisa mudar.

## Selos automáticos

Código: `packages/core/src/domain/scoring/ProductBadges.ts`.

| Selo                      | Fator                            | Regra                   |
| ------------------------- | -------------------------------- | ----------------------- |
| 🏆 Melhor Compra          | Score Geral                      | Maior valor do conjunto |
| ⭐ Melhor Avaliado        | Critério `reputation`            | Maior nota do conjunto  |
| 💰 Melhor Preço           | Preço absoluto                   | Menor valor do conjunto |
| 📊 Maior Nota Geral       | Índice SupleScore (`finalScore`) | Maior valor do conjunto |
| 🔥 Melhor Custo-Benefício | Critério `cost-benefit`          | Maior nota do conjunto  |

**Regra de desempate**: um selo só é atribuído quando há um vencedor
único — em caso de empate exato entre 2 ou mais produtos, **nenhum**
recebe o selo (nunca escolhe arbitrariamente, nunca duplica).

Um mesmo produto pode receber vários selos simultaneamente (ex.: o
produto de maior Score Geral também pode ter a maior nota do critério
`cost-benefit`).

## Explicação automática ("Por que este produto recebeu esta nota?")

Código: `packages/core/src/domain/scoring/ScoreExplanation.ts`
(`rankCriteriaByImpact`) + `src/modules/evaluation/lib/productInsights.ts`
(`buildProductSummary`, o bloco "Em resumo" da página de produto).

Critérios são ordenados por **impacto real** (`nota × peso`), não pela
nota isolada — um critério com nota alta mas peso baixo pode influenciar
menos que um com nota média e peso alto. A partir dessa ordenação:

- **Vantagens**: critérios com nota ≥ 75.
- **Pontos de atenção**: critérios com nota < 45, mais qualquer `flag`
  de validação levantada pelo próprio Core Domain durante o cálculo
  (texto do domínio, nunca reescrito).
- **"Vale a compra se..."**: menciona o critério de maior impacto real.
- **"Considere alternativas se..."**: menciona o critério de menor nota,
  quando existe algum abaixo do limiar.

Nenhuma dessas frases é texto fixo por produto — são geradas
automaticamente e mudam sozinhas se o produto for reavaliado.

## Fluxo completo (onde tudo é calculado)

```
GET /api/evaluation/rankings/[categorySlug]/view
  │
  ├─ 1. rankingService.get()                  → posições + finalScore (Application, já existia)
  ├─ 2. productViewService.loadPresentations() → preço/dose/grama/loja/imagem (presentation)
  ├─ 3. container.ports.indexResults
  │      .listLatestByCategory()              → breakdown por critério (Application, já existia)
  ├─ 4. calculateOverallScores()               → Score Geral (Core, NOVO)
  └─ 5. assignProductBadges()                 → selos (Core, NOVO)
        │
        ▼
  RankingViewEntry { ..., overallScore, badges, criteriaScores }
        │
        ├─→ /creatina (lista, ordenação "Melhor compra")
        ├─→ /creatina/[slug] (selos, "Em resumo", alternativas melhores/mais baratas)
        ├─→ Comparação (linhas "Score Geral"/"Custo-benefício", vencedor geral)
        └─→ /ofertas ("Melhores oportunidades" = maior Score Geral)
```

**Calculado uma única vez por requisição**, no endpoint — nenhuma
página, componente ou hook de cliente recalcula Score Geral, selos ou
ranqueamento de critério por conta própria (eliminação de duplicação,
ver commit desta sprint).

## Testes

- `packages/core/src/domain/scoring/OverallScoreCalculator.test.ts` —
  normalização, ausência de dado, pesos customizados.
- `packages/core/src/domain/scoring/ProductBadges.test.ts` — atribuição
  correta, empate, fator ausente.
- `packages/core/src/domain/scoring/ScoreExplanation.test.ts` —
  ordenação por impacto real.
- `test/api/rankingScoring.api.test.ts` — integração real contra o
  ranking de produção, valida que nenhum selo tem mais de um vencedor.
