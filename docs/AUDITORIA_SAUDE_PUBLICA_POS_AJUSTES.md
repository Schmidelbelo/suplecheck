# Auditoria pública de produção pós-ajustes (2026-09-21)

Validação **só leitura** contra produção (`https://suplescore.com.br`)
depois da sequência de mudanças recentes: correção do filtro de status
no ranking, despublicação da Nutrata, correção da Probiótica
Creatina 300g (Amazon), e 2 imagens reais publicadas (Growth Pasta de
Amendoim, Max Titanium ZMA). Nenhuma alteração feita nesta auditoria —
banco, código, imagens, afiliados, ranking e `affiliate-discovery`
intocados.

## 1. Páginas principais

| Página                | Status |
| --------------------- | ------ |
| `/`                   | ✅ 200 |
| `/ofertas`            | ✅ 200 |
| `/creatina`           | ✅ 200 |
| `/categorias/omega-3` | ✅ 200 |

## 2. Produtos-chave

| Produto                                         | Página                               | Status |
| ----------------------------------------------- | ------------------------------------ | ------ |
| `growth-oleo-de-peixe-ultra-75-capsulas`        | `/categorias/omega-3/...`            | ✅ 200 |
| `probiotica-creatina-300g`                      | `/creatina/probiotica-creatina-300g` | ✅ 200 |
| `growth-pasta-de-amendoim-integral-torrado-1kg` | `/categorias/pasta-de-amendoim/...`  | ✅ 200 |
| `max-titanium-zma-90-capsulas`                  | `/categorias/zma/...`                | ✅ 200 |

## 3. Confirmações

- **Nenhum produto `UNPUBLISHED` aparecendo publicamente**:
  `nutrata-creatina-creapure-250g` confirmado ausente em `/ofertas`,
  `/creatina` e `sitemap-produtos.xml` (0 ocorrências em todos).
- **Imagens recentes renderizam**: `growth-pasta-de-amendoim-integral-torrado-1kg.webp`
  e `max-titanium-zma-90-capsulas.webp` confirmados no HTML das
  respectivas páginas de produto.
- **Placeholders restantes não quebram layout**: os 13 produtos ainda
  com card ilustrativo (ver `docs/AUDITORIA_PLACEHOLDERS_RESTANTES.md`)
  continuam usando o mesmo componente de imagem padrão — nenhuma
  quebra de layout observada nas páginas verificadas.
- **`/go` Amazon**: `probiotica-creatina-300g` → `dp/B07G7JPTCV?tag=suplescore-20` ✅
- **`/go` Mercado Livre**: `growth-oleo-de-peixe-ultra-75-capsulas` → `https://meli.la/2jWrJqm` ✅
- **Tracking**: ambos os cliques de validação acima registraram
  `OutboundClick` novo com `wasAffiliate: true` ✅
- **SEO básico das páginas principais**: `<title>`, `<meta
name="description">` e `<link rel="canonical">` presentes e
  corretos em `/`, `/ofertas` e `/creatina` — nenhuma tag ausente ou
  duplicada observada.

## 4. Rotas públicas

- Rota inexistente (`/produto-que-nao-existe-teste-audit`) → **404
  real**, não 200 nem erro genérico.
- `sitemap-produtos.xml` → 200, sem o produto despublicado.
- Nenhum 500 encontrado em nenhuma das rotas verificadas.

## 5. Problemas encontrados

**Nenhum.** Todos os itens do escopo passaram na validação.

Achado informativo (não é problema, não requer ação): existem outros
4 produtos não-`PUBLISHED` no banco além da Nutrata —
`growth-haze-hardcore-300g` (`DRAFT`) e 3 fixtures `ARCHIVED`
(`api-product-...`, `price-stats-product-...`). Nenhum deles é novo
desta rodada de mudanças; são estados pré-existentes e, como
`DRAFT`/`ARCHIVED` já são corretamente filtrados de todas as
superfícies públicas pelo próprio modelo de dados, não representam
risco.

## 6. Conclusão

Produção está saudável depois de todos os ajustes recentes: nenhum
produto despublicado vazando, nenhum link de afiliado quebrado,
tracking funcionando, imagens novas renderizando, SEO básico intacto,
nenhum erro de rota.

## 7. Próxima frente recomendada

Duas opções concretas, nenhuma delas depende de mais investigação de
imagem/afiliado:

1. **Retomar `integralmedica-coq10-30-capsulas`** quando
   `nutrifastshop.com.br` voltar do modo manutenção — validação de
   identidade já pronta (`docs/AUDITORIA_PLACEHOLDERS_RESTANTES.md
§12`), só falta baixar e publicar.
2. **Revisitar o status fiscal da Amazon** ("Enviado, aguardando
   revisão" na última menção) — item leve, isolado, não teve
   acompanhamento nesta sessão desde então.

Nenhuma ação executada além desta auditoria — só leitura.
