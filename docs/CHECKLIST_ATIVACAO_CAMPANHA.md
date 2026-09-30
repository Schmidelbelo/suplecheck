# Checklist de ativação — campanha Google Ads (10 produtos prioridade A)

Versão executável do plano `docs/CAMPANHA_GOOGLE_ADS_PRIORIDADE_A.md`.
Preços e lista de 30/09/2026 (plano §0.3). Arquivos de importação em
`work/google-ads-prioridade-a/`.

> **Se hoje já passou de 03/10/2026**: recapturar os preços antes de
> ativar (item 1.6).

---

## 1. Conferências antes de ativar

- [ ] **1.1 GA4, evento-chave**: Admin > Eventos-chave >
      `outbound_link_clicked` marcado.
- [ ] **1.2 GA4, dimensões personalizadas** (escopo Evento):
      `product_slug`, `store_slug`, `destination_type`, `click_source`,
      `was_affiliate`.
- [ ] **1.3 GA4 ↔ Google Ads vinculados**: Admin > Vinculações de
      produtos > Google Ads.
- [ ] **1.4 Conversão importada no Google Ads**: Metas > Conversões >
      `outbound_link_clicked` (GA4) como **ação secundária**, contagem
      **"Uma"**. O status pode ficar "Sem conversões recentes" até o
      primeiro clique pago; isso é normal.
- [ ] **1.5 Teste de ponta a ponta** (1 vez): abrir
      `https://suplescore.com.br/creatina?ga_debug=1&utm_source=validacao&utm_medium=manual&utm_campaign=pre_ativacao`,
      aceitar os cookies, clicar num "Ver oferta" e ver o evento no
      **DebugView** marcado como evento-chave.
- [ ] **1.6 Preços**: capturados há no máximo 3 dias? Se não, recapturar
      (`prisma/recaptureVitrinePrices.ts`) antes de ativar.
- [ ] **1.7 Destinos respondem 200** (abrir cada um, ou `curl -I`):

| Grupo                                  | URL de destino                                                                                | Preço 30/09        |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------ |
| Creatina - comparacao                  | `https://suplescore.com.br/creatina`                                                          | 5 creatinas abaixo |
| Creatina - Max Titanium                | `https://suplescore.com.br/creatina/max-titanium-creatina-300g`                               | R$ 41,69           |
| Creatina - Black Skull                 | `https://suplescore.com.br/creatina/black-skull-creatina-300g`                                | R$ 28,40           |
| Creatina - Probiotica                  | `https://suplescore.com.br/creatina/probiotica-creatina-300g`                                 | R$ 37,98           |
| Creatina - Atlhetica                   | `https://suplescore.com.br/creatina/atlhetica-creatina-300g`                                  | R$ 38,16           |
| Creatina - Optimum Nutrition           | `https://suplescore.com.br/creatina/optimum-nutrition-creatine-300g`                          | R$ 87,21           |
| Pre-treino - Horus                     | `https://suplescore.com.br/categorias/pre-treino/max-titanium-horus-300g`                     | R$ 75,04           |
| Pre-treino - Evora                     | `https://suplescore.com.br/categorias/pre-treino/darkness-evora-pw-limao-150g`                | R$ 58,90           |
| Glutamina - Integralmedica             | `https://suplescore.com.br/categorias/glutamina/integralmedica-glutamina-300g`                | R$ 49,90           |
| BCAA - Max Titanium                    | `https://suplescore.com.br/categorias/bcaa/max-titanium-bcaa-2400-100-capsulas`               | R$ 51,99           |
| Melatonina - Neo Quimica (**pausado**) | `https://suplescore.com.br/categorias/melatonina/neo-quimica-melatonina-021mg-90-comprimidos` | R$ 15,00           |

- [ ] **1.8 Limite de gasto**: Faturamento > Controles da conta > limite
      de gasto da conta de **R$ 100**, ou um lembrete para pausar ao
      chegar em R$ 100.
- [ ] **1.9 Anotar data e hora de início**: ****/**** às ****:****. É
      usada para separar clique de anúncio de clique orgânico no banco.

## 2. Configuração das campanhas (as 2 iguais, exceto o orçamento)

- [ ] Tipo: **Rede de Pesquisa**, sem meta (ou "Tráfego do site"). Não
      usar Performance Max nem Display.
- [ ] Redes: **desmarcar Parceiros de pesquisa** e **desmarcar Rede de
      Display**.
- [ ] Local: **Brasil**, opção **"Presença"** (pessoas no local).
- [ ] Idioma: **Português**.
- [ ] Lance: **CPC manual**, sem CPC otimizado.
- [ ] Orçamento diário: **Creatina R$ 10** · **Outros R$ 5** (total
      R$ 15/dia).
- [ ] Teto total do teste: **R$ 100** (item 1.8).
- [ ] Programação: **todos os dias, 07:00–23:59**.
- [ ] Auto-tagging (`gclid`) **ligado**; template de rastreamento com
      UTM, já em `campaigns.csv`.
- [ ] Importar no Editor com as campanhas **Pausadas** e só ativar depois
      das seções 1–3.

## 3. Grupos e anúncios

- [ ] **Campanha `SS | Search | Creatina | Teste PA`**: 6 grupos
      (comparação + Max Titanium, Black Skull, Probiótica, Atlhetica,
      Optimum). CPC máximo de **R$ 0,70** no genérico e **R$ 0,50** nos
      de marca.
- [ ] **Campanha `SS | Search | Outros PA | Teste`**: Horus, Évora,
      Glutamina, BCAA (R$ 0,50) e **Melatonina PAUSADA**.
- [ ] 38 palavras-chave, só **exata e frase**, nenhuma ampla
      (`keywords.csv`).
- [ ] 78 negativas aplicadas: lista compartilhada nas 2 campanhas, mais
      as de campanha e grupo (`negative-keywords.csv`).
- [ ] 1 anúncio responsivo por grupo (`ads-rsa.csv`). Prévia sem erro de
      política; fixar 1 título de marca na posição 1 nos grupos de marca.
- [ ] Sitelinks e frases de destaque (`assets.csv`).
- [ ] **Toda URL final em `suplescore.com.br`**, nunca link direto para
      Amazon ou Mercado Livre.
- [ ] Ativar as 2 campanhas.

## 4. Regras de corte

| Gatilho                                                                 | Ação                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| Palavra-chave com **≥ R$ 8 gastos e 0 clique de saída** no produto dela | Pausar a palavra                                |
| Palavra-chave com **CTR < 1% após 200 impressões**                      | Pausar a palavra                                |
| **Dia 3**: grupo com **≥ 10 cliques e 0 clique de saída afiliado**      | Pausar o grupo                                  |
| **Dia 3**: campanha com **≥ 30 cliques e 0 clique de saída afiliado**   | **Pausar tudo** e investigar `/go`/rastreamento |
| Produto **indisponível** na Amazon, ou preço **> 15% acima** do exibido | Pausar o grupo até recapturar                   |
| **CPC médio > R$ 0,70** num grupo                                       | Baixar o lance em 20%                           |
| Palavra-chave com **CPC médio > R$ 1,00**                               | Pausar a palavra                                |
| Destino deixa de responder 200                                          | Pausar o grupo na hora                          |
| Anúncio reprovado por **marca registrada**                              | Tirar os 2 títulos com marca; não recorrer      |
| Anúncio reprovado por **saúde**                                         | Pausar o grupo                                  |
| Gasto acumulado chega a **R$ 100**                                      | **Pausar tudo**: fim do teste                   |
| Évora com taxa de saída muito abaixo dos outros                         | Primeiro grupo a pausar (vendedor novo)         |

## 5. Rotina diária (10–15 min)

- [ ] **Google Ads**: gasto acumulado (teto R$ 100), CTR e CPC por grupo;
      **Termos de pesquisa**, negativando o que não é compra.
- [ ] **GA4**: Relatórios > Eventos-chave e Explorar
      (`outbound_link_clicked` por `utm_term` e `product_slug`).
- [ ] **OutboundClick** (banco, só leitura): cliques desde o início, com
      `source <> 'unknown'`. Consulta pronta no plano §11, ou
      `GET /api/admin/metrics` com `x-api-key`.
- [ ] **Amazon Associates**: cliques, pedidos e ganhos do dia anterior
      (atraso de 24–48h).
- [ ] **Preço e estoque** dos 10 produtos: se passar de 3 dias desde a
      última recaptura, recapturar e aplicar a regra dos 15%.
- [ ] Anotar numa linha: data · gasto · cliques do anúncio · cliques de
      saída afiliados · pedidos · ganhos.

Contas do dia:

- **Taxa de saída** = cliques de saída afiliados ÷ cliques do anúncio
- **Custo por clique afiliado** = gasto ÷ cliques de saída afiliados
- **EPC** = ganhos Amazon ÷ cliques do anúncio

## 6. Decisão (dia 7, ou antes se o teto de R$ 100 for atingido)

| Resultado                                                                           | Decisão                                                                                                                                                        |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EPC ≥ CPC médio** (comissão paga o clique) e ≥ 3 pedidos                          | **Escalar**: +50% de orçamento só nos grupos que geraram pedido, reavaliar em 7 dias; considerar promover a conversão a primária quando houver ≥ 30 conversões |
| Taxa de saída ≥ 40%, custo por clique afiliado ≤ R$ 1,00, ≥ 1 pedido, mas EPC < CPC | **Continuar** mais 7 dias com o mesmo orçamento, só com os melhores grupos                                                                                     |
| Taxa de saída 20–40%, sem pedido                                                    | **Continuar reduzido**: R$ 10/dia só nos grupos com melhor taxa, mais 7 dias                                                                                   |
| Taxa de saída < 20% ou custo por clique afiliado > R$ 2,50                          | **Pausar** a mídia paga: o gargalo é página ou oferta, não campanha                                                                                            |
| Cliques `/go` > 0 mas 0 clique no relatório da Amazon                               | **Pausar** e investigar tag/atribuição antes de qualquer gasto                                                                                                 |
