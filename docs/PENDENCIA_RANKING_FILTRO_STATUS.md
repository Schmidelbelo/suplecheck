# Pendência técnica — ranking não filtra `Product.status` — ✅ RESOLVIDO (2026-09-18)

Registrado em 2026-09-18, a partir da investigação (só leitura) de por que
`nutrata-creatina-creapure-250g` continuou aparecendo em `/ofertas` e
`/creatina` depois de ser despublicado (`status: UNPUBLISHED`,
`docs/AUDITORIA_OPORTUNIDADES_MONETIZACAO.md §3.2`). Corrigido no código no
mesmo dia — ver "Correção aplicada" no final deste documento.

## O problema

`/ofertas` e `/creatina` (via `loadRankingView`, `src/modules/evaluation/services/rankingView.service.ts`)
leem um **snapshot pré-computado** de `Ranking`/`RankingEntry`, gerado por
`GenerateRankingUseCase` (`packages/application/src/use-cases/ranking/GenerateRankingUseCase.ts`)
e disparado manualmente via `POST /api/evaluation/rankings/{categorySlug}`
— não há cron nem trigger automático.

**Em nenhum ponto desse pipeline há um filtro `status: "PUBLISHED"`**:

- `listLatestByCategory` (`packages/infrastructure/src/repositories/prisma/PrismaIndexResultRepository.ts:113`)
  — busca a `ProductScore` mais recente de cada produto da categoria, sem
  olhar `Product.status`.
- `RankingMapper.build` (`packages/application/src/mappers/RankingMapper.ts`)
  — só ordena por nota, não filtra nada.
- `loadPresentations` (`src/modules/evaluation/services/productView.service.ts:121`)
  — busca `Product` por `id` na hora de montar a vitrine, também sem
  filtro de `status`.

O único lugar do código que hoje filtra `status: "PUBLISHED"` é
`SearchSupplementsUseCase` (a busca) — não o ranking.

## Por que só reprocessar o ranking não resolve

Confirmado em produção (só leitura, 2026-09-18): o snapshot atual de
`creatina` foi gerado em `2026-09-14T13:28:49Z` e inclui
`nutrata-creatina-creapure-250g` porque o produto ainda tem uma
`ProductScore` válida (calculada em `2026-09-02`, de quando o produto
ainda era `PUBLISHED`) — essa `ProductScore` nunca foi removida nem
recalculada depois da despublicação.

Se alguém rodar `POST /api/evaluation/rankings/creatina` agora, sem
nenhuma outra mudança, o novo snapshot **provavelmente incluiria o
produto de novo**, pelo mesmo motivo: `listLatestByCategory` ainda vai
achar essa `ProductScore` como "a mais recente" da categoria, porque
nada ali verifica se o produto continua `PUBLISHED`.

## Correção futura recomendada

Adicionar filtro `status: "PUBLISHED"` (via join com `Product` ou
checagem equivalente) nos pontos que efetivamente decidem quais produtos
entram/aparecem no ranking:

1. `listLatestByCategory` — para que produtos despublicados nem entrem
   em um snapshot novo gerado depois da correção.
2. `loadPresentations` — como segunda camada de proteção: mesmo que um
   snapshot antigo (gerado antes da correção) ainda contenha um produto
   despublicado, a leitura pública não deveria exibi-lo.
3. Qualquer ponto equivalente usado por `RankingApplicationService`/
   `RankingMapper` que hoje monta a lista de produtos elegíveis sem
   olhar `status` — vale conferir também o "Panorama do Mercado"
   (`listLatestForAllProducts`, mesmo arquivo), que tem o mesmo padrão
   sem filtro, embora não tenha sido confirmado se ele expõe este caso
   específico.

Depois da correção de código, reprocessar o ranking da categoria
afetada (`creatina`) passa a de fato remover produtos despublicados da
vitrine.

## Correção aplicada (2026-09-18)

Filtro `status: "PUBLISHED"` adicionado nos dois pontos recomendados
acima — os que de fato decidem quais produtos entram/aparecem no
ranking e nas vitrines que o consomem:

1. **`listLatestByCategory`** (`packages/infrastructure/src/repositories/prisma/PrismaIndexResultRepository.ts`)
   — `product: { status: "PUBLISHED" }` adicionado tanto no `groupBy`
   quanto no `findMany` que busca as `ProductScore` mais recentes por
   produto da categoria. Um produto despublicado não entra mais em
   nenhum **novo** snapshot gerado a partir daqui.
2. **`loadPresentations`** (`src/modules/evaluation/services/productView.service.ts`)
   — `status: "PUBLISHED"` adicionado ao `findMany` de `Product`. Rede
   de segurança na leitura pública: mesmo um snapshot **antigo** (já
   gravado antes desta correção, como o de `creatina` de
   `2026-09-14`) que ainda referencie um produto despublicado deixa de
   exibi-lo, porque a apresentação some do `Map` — `rankingView.service.ts`,
   `marketData.service.ts` e `recommendationData.service.ts` já
   descartam entradas sem apresentação (padrão pré-existente,
   confirmado nos três antes da mudança).

`RankingMapper` e `RankingApplicationService` não precisaram de
alteração — nenhum dos dois decide quais produtos entram na lista,
apenas ordenam/leem o que já chegou filtrado.

**Não alterado**: nenhuma `ProductScore` foi apagada ou modificada —
a de Nutrata continua existindo no histórico, só deixa de ser
considerada "elegível para ranking" por causa do `status` do produto,
não por remoção de dado.

**Testes adicionados**:

- `packages/infrastructure/test/PrismaEvaluationRepositories.test.ts`
  — `listLatestByCategory()` não inclui produto `UNPUBLISHED`, mesmo
  com `ProductScore` existente (produto publicado no mesmo teste
  continua aparecendo).
- `src/modules/evaluation/services/productView.service.test.ts` (novo)
  — `loadPresentations()` não inclui produto `UNPUBLISHED` no `Map`,
  mesmo pedido explicitamente por `id`.
- `test/api/evaluation.api.test.ts` e
  `test/integration/evaluation.integration.test.ts` ajustados: os
  produtos de teste precisaram ser publicados explicitamente
  (`PUT .../status` ou `setSupplementStatus`) antes de gerar ranking —
  produto novo nasce `DRAFT`, e agora isso é respeitado pelo pipeline
  de geração.

`npm run typecheck` limpo, **201/201 testes passando** (40/40 arquivos)
depois da correção.

## Estado em produção (aguardando deploy + reprocessamento)

- Código corrigido e commitado localmente — **ainda não deployado em
  produção** no momento em que este documento foi atualizado.
- Depois do deploy, o snapshot de `creatina` gerado em
  `2026-09-14T13:28:49Z` (o que hoje está em produção) **continua
  contendo** `nutrata-creatina-creapure-250g`, porque é um snapshot
  antigo, gravado antes da correção — a rede de segurança de
  `loadPresentations` já esconde o produto na leitura mesmo assim, mas
  reprocessar o ranking da categoria `creatina`
  (`POST /api/evaluation/rankings/creatina`) depois do deploy é o
  passo que limpa o snapshot em si, não só a exibição.
- Nenhum reprocessamento foi executado nesta frente — fora do escopo
  autorizado desta tarefa (documentação + código, sem ação
  operacional em produção).
- Ver também `docs/AUDITORIA_OPORTUNIDADES_MONETIZACAO.md §3.2` para o
  histórico completo da despublicação deste produto.
