# Auditoria de qualidade de dados — ofertas publicadas

Levantamento **só leitura** contra produção, 2026-09-21 — varredura
dos 59 produtos `PUBLISHED` procurando inconsistências acionáveis que
não dependam de decidir ASIN/sabor/imagem (essas já estão mapeadas em
`docs/AUDITORIA_PROXIMOS_CANDIDATOS_MONETIZACAO.md` e
`docs/AUDITORIA_PLACEHOLDERS_RESTANTES.md`). **Nada foi alterado** —
nenhum banco, catálogo, afiliado, imagem, ranking, código, schema ou
`affiliate-discovery` tocado.

---

## 1. Verificações que passaram limpas

| Verificação                                                                         | Resultado                                                                                                               |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Produto `PUBLISHED` sem SKU                                                         | ✅ 0 encontrados                                                                                                        |
| Produto `PUBLISHED` sem `PriceEntry`                                                | ✅ 0 encontrados                                                                                                        |
| Preço zerado ou absurdo (`≤ R$0` ou `> R$20.000`)                                   | ✅ 0 encontrados                                                                                                        |
| Loja rejeitada (Netshoes) usada como oferta principal                               | ✅ 0 encontrados — a última oferta em Netshoes (Probiótica Creatina 300g) já foi migrada para `amazon-br` em 2026-09-18 |
| Produto com placeholder de imagem mas fora da fila `PendingImage` (gap no pipeline) | ✅ 0 encontrados — os 13 placeholders atuais estão todos corretamente na fila                                           |

## 2. Problemas encontrados

### 🟡 Médio — `growth-creatina-monohidratada-300g`: slug e nome divergem no peso

- **Slug**: `growth-creatina-monohidratada-300g` (diz **300g**)
- **`Product.name`**: `"Creatina Monohidratada 250g"` (diz **250g**)
- **Origem**: em 2026-09-16/17 o nome foi corrigido de "300g" para
  "250g" (`docs/AUDITORIA_COBERTURA_IMAGENS.md §6` — a Growth não
  vende essa creatina em 300g, só 250g; preço já capturado bate com a
  faixa real de 250g) — mas o **slug nunca foi atualizado junto**,
  então a URL pública ainda diz "300g" enquanto o título da página diz
  "250g".
- **Impacto**: confusão de SEO/confiança — um usuário ou o Google
  veem `/creatina/growth-creatina-monohidratada-300g` como URL, mas o
  `<title>`/conteúdo da página diz 250g. Não afeta preço nem
  conversão (a oferta em si está correta), mas é uma inconsistência
  visível.
- **Por que não é alto**: não quebra nenhuma funcionalidade, não gera
  404, não afeta afiliado/checkout — é qualidade de dado/SEO, não
  algo que afeta o usuário imediatamente na hora de comprar.

### 🟡 Médio — 3 ofertas ainda com URL de busca genérica da Amazon

Já mapeadas e com risco documentado em
`docs/AUDITORIA_PROXIMOS_CANDIDATOS_MONETIZACAO.md §2` — reconfirmadas
ainda presentes hoje, nenhuma mudança desde a última auditoria:

| Produto                                 | URL atual                                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `vitafor-creatina-300g`                 | `amazon.com.br/s?k=Vitafor+Creatina+300g` (🔴 alto risco — 2 linhas reais distintas, não configurar)                                     |
| `dux-creatina-300g`                     | `amazon.com.br/s?k=Dux+Nutrition+Creatina+300g` (🔴 alto risco — 3 linhas nomeadas distintas, não configurar)                            |
| `integralmedica-creatina-creapure-300g` | `amazon.com.br/s?k=Integralm%C3%A9dica+Creatina+Creapure+300g` (🟡 médio risco — linha confirmada, falta navegador real para ASIN exato) |

Nenhum dos 3 é "candidato seguro novo" — já estão classificados e
pendentes de decisão humana ou navegador real, não é uma descoberta
desta auditoria.

## 3. Achados de baixo risco (limpeza futura, sem urgência)

- **9 capturas de preço com mais de 14 dias** (não é erro, só
  informação de frescor): `vitafor-creatina-300g` (18d),
  `dux-creatina-300g` (18d), `integralmedica-creatina-creapure-300g`
  (18d), `integralmedica-whey-protein-concentrado-900g` (15d),
  `nutrata-w100-whey-concentrado-900g` (15d),
  `darkness-dark-whey-protein-concentrado-900g` (15d),
  `probiotica-hiper-100-whey-900g` (15d),
  `max-titanium-100-whey-protein-900g` (15d),
  `adaptogen-tasty-whey-3w-900g` (15d). Os 3 primeiros já são
  conhecidos (URL genérica pendente); os outros 6 são só preços que
  não foram recapturados recentemente — não é um erro, é um sinal de
  que o job de captura de preço pode estar espaçado demais para esses
  itens, mas fora do escopo desta auditoria de catálogo.
- **`PendingImage` órfão** (`Produto Price Stats`, fixture `ARCHIVED`)
  — já documentado em auditorias anteriores, cosmético, sem urgência.

## 4. Top oportunidades seguras

Nenhuma nova oportunidade de **monetização** segura foi encontrada
nesta auditoria — o universo de candidatos Amazon/Mercado Livre já
estava mapeado (`docs/AUDITORIA_PROXIMOS_CANDIDATOS_MONETIZACAO.md`)
e nada mudou desde a última verificação.

A única oportunidade nova e genuinamente segura é de **qualidade de
dado**, não monetização: corrigir o slug de
`growth-creatina-monohidratada-300g`.

## 5. Recomendação — 1 próxima ação concreta

**Corrigir a divergência slug/nome de `growth-creatina-monohidratada-300g`.**

Duas formas possíveis (decisão de quem administra o catálogo, não
decidida aqui):

1. **Renomear o slug** para `growth-creatina-monohidratada-250g`
   (alinha com o nome já correto) — mas isso muda a URL pública,
   exige redirecionamento (`301`) do slug antigo para o novo se
   houver qualquer link externo/indexação já apontando para a URL de
   300g, para não quebrar SEO/backlinks existentes. É a correção
   "certa" a longo prazo, mas tem mais superfície de risco.
2. **Manter o slug como está** e só documentar a divergência como
   conhecida/aceita — caminho de menor risco imediato, mas deixa a
   inconsistência visível permanentemente.

Nenhuma das duas foi executada nesta auditoria (altera catálogo/slug,
fora do escopo "somente leitura" desta tarefa) — fica registrada como
a próxima decisão concreta a tomar.

## 6. Correção aplicada (2026-09-21) — slug renomeado com redirect

Opção 1 (renomear) executada, com autorização explícita:

- **`Product.slug`** alterado diretamente em produção:
  `growth-creatina-monohidratada-300g` → `growth-creatina-monohidratada-250g`
  (só o campo `slug`; preço, imagem, `affiliateUrl` e todos os demais
  campos preservados — nenhum outro produto tocado).
- **Redirect 301** (na prática `308 Permanent Redirect`, o equivalente
  moderno do Next.js para `permanent: true` — tratado de forma
  idêntica pelos buscadores) adicionado em `next.config.ts`
  `redirects()`, o mesmo mecanismo já usado para o redirect
  `www → apex`. Não exigiu schema/migration novo.
- Deploy feito a partir de um `git worktree` limpo no commit
  `09b2db4` (nunca a partir da working tree principal, que tem
  `affiliate-discovery` não commitado), via `vercel --prod`.

**Validação pós-deploy**:

| Critério                                       | Resultado                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/creatina/growth-creatina-monohidratada-250g` | ✅ 200                                                                                                                                                                                                                                                                                                                                             |
| `/creatina/growth-creatina-monohidratada-300g` | ✅ `308` → `Location: /creatina/growth-creatina-monohidratada-250g`                                                                                                                                                                                                                                                                                |
| `/go/growth-creatina-monohidratada-250g`       | ✅ redireciona para `dp/B0CJG32CZ6?tag=suplescore-20`, tracking confirmado (`wasAffiliate: true`)                                                                                                                                                                                                                                                  |
| `<link rel="canonical">` na página nova        | ✅ aponta para o slug novo                                                                                                                                                                                                                                                                                                                         |
| `sitemap-produtos.xml`                         | ✅ só o slug novo (0 ocorrências do antigo) — gerado dinamicamente do banco, sem mudança de código adicional                                                                                                                                                                                                                                       |
| `/ofertas`                                     | ✅ 200, usa o slug novo nos links de produto (a única ocorrência remanescente do texto "300g" é o **nome do arquivo de imagem** no Vercel Blob, `growth-creatina-monohidratada-300g.webp` — artefato de quando a imagem foi publicada sob o slug antigo; a imagem em si renderiza normalmente e não foi tocada, não é uma referência de rota/slug) |
| `npm run typecheck`                            | ✅ limpo                                                                                                                                                                                                                                                                                                                                           |
| Testes                                         | ✅ 201/201 (1 falha isolada em `evaluation.api.test.ts` na primeira rodada, reconfirmada como flakiness transiente de conexão — passou limpo ao rodar de novo sozinho)                                                                                                                                                                             |

Nenhum outro produto, preço, imagem, afiliado ou ranking alterado.
`affiliate-discovery` seguiu intocado durante todo o processo.
