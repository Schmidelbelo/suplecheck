# Plano de SEO/Conversão — Páginas Públicas Prioritárias

Gerado em 2026-09-15. Contexto: monetização técnica já está pronta e
honesta (`/go` registra clique, CTAs passam por ele, painel mostra
cobertura real, 15 produtos monetizados via Amazon, 4 lojas afiliadas
aguardando link real — ver `docs/AUDITORIA_AFFILIATE_BASE_URLS.md`).
Faltam apenas dois insumos externos: links reais de afiliado e
`BLOB_READ_WRITE_TOKEN` pra imagens. Este plano cobre o que dá pra
melhorar **sem depender de nenhum dos dois** — copy, estrutura, SEO
técnico e percepção de compra nas páginas que já têm produto e preço
reais no banco.

---

## 1. Auditoria das páginas públicas atuais

| Página                                                                                      | Rota real                                                       | Estado                                                                                                                             |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Home                                                                                        | `src/app/page.tsx`                                              | Boa — `RankingPreview` com dado real, FAQPage JSON-LD, `WeeklyHighlights`                                                          |
| Ranking de categoria (creatina)                                                             | `src/app/creatina/page.tsx`                                     | Boa — bespoke, `generateMetadata`, dado real, JSON-LD                                                                              |
| Ranking de categoria (genérico)                                                             | `src/app/categorias/[slug]/page.tsx`                            | Boa — `generateStaticParams`+`generateMetadata` por categoria, JSON-LD (FAQPage + breadcrumb), dado real                           |
| Subpáginas de filtro (custo-benefício, menor preço/dose, mais vendidos, mais bem avaliados) | `.../melhor-custo-beneficio` etc., via `CategoryFilterPage.tsx` | Boas onde existem — só aparecem em categorias com ≥8 produtos publicados (regra editorial em `docs/INVENTARIO_CONTEUDO_FUTURO.md`) |
| Página de produto                                                                           | `ProductDetailPage.tsx` (compartilhado)                         | Boa — H1, `generateMetadata`, JSON-LD `Product`+breadcrumb, CTA via `/go`                                                          |
| `/ofertas`                                                                                  | `src/app/ofertas/page.tsx`                                      | **Tinha bug real**: só carregava `creatina`, mas o título prometia "Creatina, Whey e Pré-Treino" — corrigido nesta tarefa (§4)     |
| `/comparar`                                                                                 | `src/app/comparar/page.tsx` + `[pair]`                          | Boa — genérica, dado real, JSON-LD                                                                                                 |

Duas pastas de rota mortas encontradas (grupos `(catalog)` e `(compare)`,
sem `page.tsx` dentro) — não afetam nada em produção (Next não roteia
grupo vazio), fora do escopo desta tarefa (não são página pública real,
não mexi nelas).

## 2. Categorias reais no banco hoje (produtos `PUBLISHED`)

| categorySlug                                                                                            | Produtos | Filtro editorial (≥8)                         |
| ------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| `whey-protein`                                                                                          | 16       | ✅ subpáginas de filtro disponíveis           |
| `creatina`                                                                                              | 11       | ✅ subpáginas de filtro disponíveis           |
| `pre-treino`                                                                                            | 6        | ❌ só ranking principal                       |
| `omega-3`                                                                                               | 4        | ❌ só ranking principal                       |
| `cafeina`                                                                                               | 4        | ❌ só ranking principal                       |
| `colageno`                                                                                              | 3        | ❌                                            |
| `melatonina`                                                                                            | 2        | ❌                                            |
| `glutamina`, `zma`, `bcaa`, `coenzima-q10`, `barras-de-proteina`, `pasta-de-amendoim`, `hipercaloricos` | 2 cada   | ❌                                            |
| `multivitaminicos`                                                                                      | 0        | ❌ sem produto — página existe mas fica vazia |

Relevante pro pedido original de "melhor melatonina": a categoria **existe**
e tem produto real (2), então `/categorias/melatonina` já funciona hoje com
dado real — mas ainda não passa da régua de 8 produtos pra ganhar
subpáginas de filtro dedicadas (`melhor-custo-beneficio` etc.), e o
comparativo "melhor X" fica fraco com só 2 opções. Não é bloqueio técnico,
é conteúdo insuficiente — não inventamos produto pra preencher.

## 3. Top 10 páginas priorizadas (SEO + receita)

Critério: intenção de compra do termo × volume de produtos reais
disponíveis pra sustentar a página × produtos já monetizados (Amazon) que
convertem imediatamente.

| #   | Página                         | Rota                                              | Por quê                                                                                                                                          |
| --- | ------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Melhor creatina                | `/creatina`                                       | Maior intenção + maior volume (11 produtos) + vários já monetizados via Amazon                                                                   |
| 2   | Melhor whey protein            | `/categorias/whey-protein`                        | Maior volume do catálogo (16 produtos), alta intenção comercial                                                                                  |
| 3   | Ofertas                        | `/ofertas`                                        | Página de maior intenção de compra pura ("promoção", "oferta") — tinha bug real de escopo, agora cobre todas as categorias                       |
| 4   | Creatina custo-benefício       | `/creatina/melhor-custo-beneficio`                | Intenção de compra qualificada (decisão por preço), volume suficiente                                                                            |
| 5   | Whey custo-benefício           | `/categorias/whey-protein/melhor-custo-beneficio` | Mesma lógica de #4, maior categoria do catálogo                                                                                                  |
| 6   | Melhor pré-treino              | `/categorias/pre-treino`                          | Intenção alta, volume aceitável (6)                                                                                                              |
| 7   | Melhor ômega 3                 | `/categorias/omega-3`                             | Intenção alta (saúde/rotina), volume aceitável (4)                                                                                               |
| 8   | Home                           | `/`                                               | Porta de entrada — já é o ponto mais forte do funil de descoberta                                                                                |
| 9   | Comparar (pares mais buscados) | `/comparar/[pair]`                                | Intenção de decisão final, útil pra quem já reduziu a 2 opções                                                                                   |
| 10  | Melhor melatonina              | `/categorias/melatonina`                          | Intenção alta, mas só 2 produtos hoje — prioridade menor até o catálogo crescer nessa categoria; **não inventar produto pra subir a prioridade** |

`multivitaminicos` fica fora do top 10 por não ter nenhum produto
publicado — a página existe tecnicamente mas não tem o que mostrar; entra
na lista assim que houver produto real.

## 4. As 3 páginas/ajustes implementadas nesta tarefa

Escolhidas por maior impacto (alcance: quantas páginas/categorias cada
mudança melhora de uma vez) com menor risco (mudança aditiva, sem tocar
dado comercial nem depender de link novo).

### 4.1 Correção do `/ofertas` (item #3 do ranking)

**Antes:** `loadRankingView("creatina")` fixo — só creatina aparecia,
mesmo o título/descrição prometendo "Creatina, Whey e Pré-Treino em
Promoção". Um visitante buscando "oferta whey protein" caindo aqui via
SEO não via nenhum whey.

**Depois** (`src/app/ofertas/page.tsx`):

- Percorre **todas as categorias ativas** do banco (`prisma.category.findMany({ where: { active: true } })`), carrega o ranking real de cada uma e agrega as ofertas — sem listar categoria por categoria no código, então não fica defasado quando uma categoria nova ganhar produto.
- Título/descrição reescritos pra não prometer categorias específicas: "Ofertas de Suplementos em Promoção — Preço Real, Sem Estimativa" / cobre "todas as categorias avaliadas".
- Nenhuma lógica de cálculo mudou (`buildOffersOverview`, `OfferCard`, CTAs via `/go`) — só a fonte de produtos passou de 1 categoria fixa pra todas.

### 4.2 Loja visível perto do preço em todos os cards de ranking/oferta (itens #1, #2, #4, #5, #6, #7, #9 do ranking — cascata)

**Antes:**

- `RankingEntryCard.tsx` (usado em `/creatina`, `/categorias/[slug]` e nas 4 subpáginas de filtro de toda categoria) só mostrava o nome da loja quando `pricePerDoseCents` também existia — produtos sem dose calculável (ex.: cápsulas sem `servingsPerUnit`) mostravam preço sem dizer onde comprar.
- `ProductMiniCard.tsx` (compartilhado por 8 lugares: `/ofertas`, `/marcas/[slug]`, `WeeklyHighlights` na home, `CategoryFilterPage` — as 4 subpáginas de filtro genéricas —, `AlternativeRecommendationCard`, `ProductDetailPage`, dashboard e recomendação personalizada) nunca mostrava loja nenhuma, só preço.

**Depois:**

- `RankingEntryCard.tsx` — nome da loja aparece sempre que há preço, com ou sem preço por dose calculável.
- `ProductMiniCard.tsx` — novo prop opcional `storeName`; quando presente e há preço, mostra "na {loja}" logo abaixo do preço. Prop opcional e sem valor padrão obrigatório — nenhum dos 8 chamadores quebra; passei `storeName` explicitamente nos 5 que já tinham esse dado à mão sem precisar buscar nada novo: `OfferCard` (`/ofertas`), `WeeklyHighlights` (home), `CategoryFilterPage` (subpáginas de filtro de toda categoria), `AlternativeRecommendationCard` e `ProductDetailPage` (bloco de comparação).
- Também aumentei a imagem do `ProductMiniCard` de 48×48 pra 64×64 — mais visível em mobile, onde a maioria das visitas de busca chega.

Isso melhora simultaneamente `/creatina`, `/categorias/whey-protein`,
`/categorias/pre-treino`, `/categorias/omega-3`, `/categorias/melatonina`,
as 8 subpáginas de filtro existentes, `/ofertas`, a home e a página de
produto — sem tocar em nenhum dado comercial, só em como o dado real já
existente é mostrado.

## 5. O que fica fora desta rodada (documentado, não implementado)

- **Melhor melatonina** e as demais categorias com <8 produtos: já
  funcionam com o ganho do §4.2, mas não recebem subpágina de filtro
  dedicada (regra editorial de 8 produtos) — não é algo a "implementar",
  é esperar o catálogo crescer organicamente nessas categorias.
- **`multivitaminicos`**: 0 produtos publicados — nada a melhorar até
  existir produto real.
- Imagens maiores/reais (`BLOB_READ_WRITE_TOKEN`) e ativação de novas
  lojas afiliadas: bloqueados por insumo externo, como já documentado em
  `docs/DEPLOY_PRIMEIRA_RECEITA.md` e `docs/AUDITORIA_AFILIADOS.md` — não
  reabertos aqui.
- Limpeza dos diretórios de rota mortos (`(catalog)`, `(compare)`): não é
  uma página pública, fora do escopo "páginas que captam tráfego" desta
  tarefa.

## 6. Garantias desta tarefa

- Nenhum dado, preço, claim ou benefício foi inventado — toda mudança é
  estrutural/de apresentação sobre dado que já vinha do banco.
- Nenhum `affiliateBaseUrl` ou dado comercial foi alterado.
- CTAs continuam passando por `buildOutboundHref()` → `/go` em todos os
  componentes tocados — nenhum link direto novo foi introduzido.
- `npm run typecheck` e `npm test` verificados após as mudanças (ver
  resultado no fechamento da tarefa).
