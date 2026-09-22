# Relatório de Cliques Afiliados — 2026-09-22

Leitura direta de `outbound_clicks` (via Prisma, read-only) para entender se os
links monetizados hoje geram sinal real e quais produtos/lojas priorizar para
receita. Nenhuma alteração de banco, código ou configuração de afiliado feita
para gerar este relatório.

## 1. Resumo geral

| Período            | Total | `wasAffiliate=true` | `wasAffiliate=false` |
| ------------------ | ----- | ------------------- | -------------------- |
| Histórico completo | 509   | 95 (18,7%)          | 414 (81,3%)          |
| Últimos 7 dias     | 78    | 43 (55,1%)          | 35 (44,9%)           |

O percentual de cliques afiliados nos últimos 7 dias (55,1%) é bem maior que
no histórico completo (18,7%) — sinal de que a monetização (hoje só via
Amazon Associates) começou a captar uma fatia relevante do tráfego recente,
não só um resíduo do passado.

## 2. Configuração de afiliado hoje

Apenas 2 lojas têm `isAffiliate = true` no banco:

| Loja     | `affiliateBaseUrl`       | Está de fato monetizando?                      |
| -------- | ------------------------ | ---------------------------------------------- |
| Amazon   | `tag=suplescore-20`      | **Sim** — 89 cliques afiliado, 88 diretos      |
| Netshoes | `null` (não configurado) | Não — 11 cliques, todos caem para a URL direta |

Todas as outras 27 lojas com clique registrado têm `isAffiliate = false` —
comportamento esperado, nenhuma delas tem programa configurado ainda.

## 3. Por loja (total histórico, cliques recebidos)

| Loja                                 | Afiliado | Direto | Total |
| ------------------------------------ | -------- | ------ | ----- |
| amazon-br                            | 89       | 88     | 177   |
| loja-oficial (placeholder)           | 0        | 90     | 90    |
| mercado-livre                        | 6\*      | 20     | 26    |
| essencia-brasileira                  | 0        | 21     | 21    |
| fastfit-suplementos                  | 0        | 12     | 12    |
| nutri-fast-shop                      | 0        | 12     | 12    |
| netshoes                             | 0        | 11     | 11    |
| vitafor-oficial                      | 0        | 10     | 10    |
| ... (demais lojas, 1–9 cliques cada) | 0        | —      | —     |

\* `mercado-livre` mostrou 6 cliques com `wasAffiliate=true` embora não conste
como `isAffiliate=true` na consulta de configuração atual — vale conferir se
é um resíduo de teste/estado anterior do banco antes de tratar como sinal real
(fora do escopo deste relatório, que é só leitura).

## 4. Produtos

- **60** produtos distintos têm pelo menos 1 clique registrado.
- **17** produtos já tiveram pelo menos 1 clique afiliado real (`wasAffiliate=true`).
- **43** produtos têm clique(s) mas **nenhum** foi afiliado — cliques "perdidos" do ponto de vista de receita, hoje.

### Top produtos por clique afiliado (sinal de receita real, via Amazon)

| #   | Produto                                            | Categoria    | Afiliado | Direto |
| --- | -------------------------------------------------- | ------------ | -------- | ------ |
| 1   | Creatina Monohidratada 250g                        | creatina     | 13       | 13     |
| 2   | Integralmédica Ômega 3 1360mg 60 Cápsulas          | omega-3      | 7        | 2      |
| 3   | Micronized Creatine Powder 300g                    | creatina     | 7        | 14     |
| 4   | Creatina Black Skull 300g                          | creatina     | 6        | 4      |
| 5   | Creatina 100% Pure 300g                            | creatina     | 6        | 29     |
| 6   | Neo Química Melatonina 0,21mg 90 Comp. Sublinguais | melatonina   | 6        | 2      |
| 7   | Max Titanium Hórus 300g                            | pre-treino   | 6        | 0      |
| 8   | Growth Whey Protein Concentrado 900g               | whey-protein | 6        | 3      |
| 9   | Creatina 300g                                      | creatina     | 6        | 7      |
| 10  | Growth Supplements Óleo de Peixe Ultra 75 Cápsulas | omega-3      | 6        | 6      |

`creatina` domina o top — categoria com maior tráfego já convertendo em
cliques afiliados.

### Top oportunidades — clique existe, monetização não (priorizar ativação de afiliado)

| #   | Produto                                                | Categoria    | Cliques diretos |
| --- | ------------------------------------------------------ | ------------ | --------------- |
| 1   | Creatina Dux 300g                                      | creatina     | 16              |
| 2   | Adaptogen Tasty Whey 3W 900g                           | whey-protein | 14              |
| 3   | Creatina Vitafor 300g                                  | creatina     | 12              |
| 4   | Integralmédica Whey Protein Concentrado 100% Pure 900g | whey-protein | 11              |
| 5   | Creatina Creapure 300g                                 | creatina     | 11              |
| 6   | Max Titanium 100% Whey Protein Concentrado 900g        | whey-protein | 11              |
| 7   | Max Titanium Colagen 100 Cápsulas                      | colageno     | 9               |
| 8   | Probiótica Pro Collagen 330g                           | colageno     | 9               |
| 9   | BodyAction Body Whey Protein 900g                      | whey-protein | 8               |
| 10  | Growth Supplements Cafeína 200mg 60 Cápsulas           | cafeina      | 8               |

`creatina` e `whey-protein` também dominam aqui — mesmas categorias de maior
tráfego, mas em lojas sem afiliado configurado (Dux, Vitafor, Integralmédica,
Max Titanium, Probiótica, BodyAction, Growth).

## 5. Leitura e recomendação de próxima ação

1. **Amazon já é o único canal monetizado e está funcionando** — 89 cliques
   afiliado reais, com uma fatia crescente do tráfego recente (55% dos
   cliques dos últimos 7 dias). Não há ação técnica pendente aqui.
2. **Netshoes está tecnicamente pronta mas sem `affiliateBaseUrl`** — 11
   cliques diretos "perdidos" até hoje. Se o programa de afiliado da Netshoes
   já foi aprovado (ver `AFFILIATES.md`, via Rakuten Advertising), ativar é
   só preencher o campo — nenhum código pendente.
3. **Maior oportunidade imediata por volume de clique não monetizado**:
   **Creatina** e **Whey Protein** são as categorias que mais geram clique
   sem afiliado hoje — Dux, Vitafor, Integralmédica, Max Titanium, Probiótica
   e Adaptogen concentram o maior volume de cliques diretos "perdidos"
   (todas essas marcas já estão mapeadas em `AFFILIATES.md`, seção 6/8, com
   status de programa e rede correspondente).
   - **Recomendação de próxima ação de receita**: priorizar a aprovação
     comercial dos programas dessas marcas na ordem de maior clique direto —
     Dux (16), Vitafor (12), Max Titanium (11) e Integralmédica (11, embora o
     programa de afiliado tradicional da Integralmédica ainda não tenha sido
     confirmado — ver bloqueio comercial em aberto). Cada uma, uma vez
     aprovada, é só um `UPDATE` de `Store.affiliateBaseUrl` — sem trabalho de
     código.

## Metodologia

Consulta feita via script Prisma temporário (`prisma.outboundClick.groupBy`
por `productId`/`storeId` × `wasAffiliate`, mais contagens totais e dos
últimos 7 dias), executado uma vez contra o banco de desenvolvimento local e
descartado — não foi commitado nenhum script, só este relatório.
