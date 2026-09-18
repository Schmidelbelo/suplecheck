# Pendência técnica — ranking não filtra `Product.status`

Registrado em 2026-09-18, a partir da investigação (só leitura) de por que
`nutrata-creatina-creapure-250g` continuou aparecendo em `/ofertas` e
`/creatina` depois de ser despublicado (`status: UNPUBLISHED`,
`docs/AUDITORIA_OPORTUNIDADES_MONETIZACAO.md §3.2`). **Nenhum código foi
alterado para produzir este documento** — é só o registro da pendência.

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

## Estado atual (2026-09-18)

- Nenhuma ação operacional foi executada a partir desta pendência —
  nem reprocessamento de ranking, nem alteração de `ProductScore`, nem
  mudança de código.
- `nutrata-creatina-creapure-250g` continua aparecendo em `/ofertas` e
  `/creatina` até esta pendência ser resolvida (ou até alguém decidir
  agir diretamente sobre a `ProductScore`/snapshot como paliativo).
- Ver também `docs/AUDITORIA_OPORTUNIDADES_MONETIZACAO.md §3.2` para o
  histórico completo da despublicação deste produto.
