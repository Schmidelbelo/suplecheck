# GA4 — medição e conversão do clique "Ver oferta"

Como o SupleScore mede tráfego (inclusive pago) e o clique de saída para a
loja no Google Analytics 4, e como deixar isso pronto para o Google Ads.

## 1. O que o site faz

| Peça                       | Arquivo                                                                                  | O que faz                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carregamento do GA4        | `src/modules/analytics/components/AnalyticsScripts.tsx`                                  | Injeta `gtag.js` **só** quando `NEXT_PUBLIC_GA_ID` existe **e** o visitante aceitou cookies de análise (LGPD, cookie `suplescore-cookie-consent=accepted`). Sem as duas condições, nenhum script do Google roda.                                                                                                            |
| Evento de clique           | `src/modules/analytics/components/TrackedOutboundLink.tsx`                               | Todo botão "Ver oferta" (página de produto, barra mobile, ranking, `/ofertas`, relacionados, alternativas) dispara `outbound_link_clicked` no clique. O link continua sendo `/go/{slug}?source=...`, e a navegação nunca espera o analytics.                                                                                |
| Parâmetros do evento       | `src/modules/analytics/lib/outboundClickEvent.ts`                                        | Monta o payload (tabela abaixo). **Nunca inclui a URL de destino** (tag e deeplink de afiliado ficam fora do analytics).                                                                                                                                                                                                    |
| Preservação de UTM/`gclid` | `src/modules/analytics/components/AttributionCapture.tsx` + `lib/campaignAttribution.ts` | Guarda UTM e `gclid` da URL de chegada em `sessionStorage` (só no dispositivo, nada é enviado). Se o aceite de cookies vier depois de o visitante já ter trocado de página, o init do GA4 reaplica esses parâmetros no `page_location` da primeira inicialização, uma vez por sessão, e a sessão fica atribuída ao anúncio. |
| Modo debug                 | `AnalyticsScripts.tsx`                                                                   | `?ga_debug=1` em qualquer URL liga `debug_mode` pelo resto da sessão (aba), para ver os eventos em **GA4 > Admin > DebugView**.                                                                                                                                                                                             |

O `/go` e a tabela `outbound_clicks` não mudaram: continuam registrando
**todo** clique, com ou sem consentimento. O GA4 é a camada de atribuição
de campanha; `outbound_clicks` segue sendo a contagem completa.

### Evento `outbound_link_clicked`

| Parâmetro                                                             | Exemplo                                                                                                         | Observação                                                                                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product_slug`                                                        | `max-titanium-creatina-300g`                                                                                    |                                                                                                                                                    |
| `store_slug`                                                          | `amazon-br`                                                                                                     | `unknown` se o produto não tiver oferta                                                                                                            |
| `destination_type`                                                    | `amazon` / `mercado_livre` / `other`                                                                            | inferido só do slug da loja                                                                                                                        |
| `click_source`                                                        | `product-page`, `product-page-mobile-bar`, `ranking`, `offers`, `related-product`, `alternative-recommendation` | superfície do clique (mesmo valor do `?source=` do `/go`)                                                                                          |
| `was_affiliate`                                                       | `true` / `false`                                                                                                | mesma regra do `/go` (`PriceEntry.affiliateUrl`, senão `Store.affiliateBaseUrl` reconhecido). É o valor no momento em que a página foi renderizada |
| `position`                                                            | `4`                                                                                                             | posição no ranking, quando houver                                                                                                                  |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | `google`, `cpc`, …                                                                                              | só quando a sessão veio de URL com UTM. O `gclid` **não** vai como parâmetro (o GA4 já o usa na atribuição da sessão)                              |

Nenhum dado pessoal é coletado: sem e-mail, nome, IP em claro
(`anonymize_ip`), texto digitado ou URL de afiliado.

## 2. Configurar em produção

O Measurement ID de produção **já está configurado** (`G-FBX4LQ94H3`,
conferido em 29/09 no HTML servido a um visitante com consentimento).
Para outro ambiente ou uma troca de propriedade:

1. GA4 > Admin > Fluxos de dados > Web: copiar o **ID da métrica**
   (`G-XXXXXXXXXX`).
2. Vercel > Projeto > Settings > Environment Variables:
   `NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX`, só em **Production** (deixar vazio
   em Preview/Development para não poluir os dados).
3. **Redeploy**: `NEXT_PUBLIC_*` é embutida no build, então só trocar a
   variável não basta.
4. Conferir: abrir o site numa aba anônima, aceitar os cookies e ver em
   DevTools > Rede um request para `googletagmanager.com/gtag/js?id=G-...`.

O ID de medição não é segredo (vai no HTML público de qualquer site com
GA4). Não há nenhuma chave secreta envolvida.

## 3. Configurar no GA4 (uma vez, no painel)

1. **Dimensões personalizadas**, em Admin > Definições personalizadas >
   Criar dimensão personalizada, escopo **Evento**, uma por parâmetro:
   `product_slug`, `store_slug`, `destination_type`, `click_source`,
   `was_affiliate`. Opcional: `utm_campaign`, `utm_term`, `utm_content`
   como dimensões de evento, para cruzar o clique com o anúncio mesmo
   quando a sessão for atribuída a outra origem.
   - Sem esse registro o evento chega, mas os parâmetros não aparecem nos
     relatórios, só no DebugView e no Explorar.
2. **Evento-chave (conversão)**: Admin > Eventos (ou Eventos-chave) >
   marcar `outbound_link_clicked` como evento-chave. Ele só aparece na
   lista depois de disparar pelo menos uma vez, então faça a validação da
   §4 antes.
3. **Vincular ao Google Ads**: Admin > Vinculações de produtos > Google
   Ads > vincular a conta, com a opção de ativar a importação de
   conversões e a de auto-tagging.
4. **Importar a conversão no Google Ads**: Metas > Conversões > Nova >
   Importar > Google Analytics 4 > `outbound_link_clicked`. Recomendado:
   ação **secundária** nos primeiros 7 dias (só observação, sem afetar
   lance manual) e contagem **"Uma"** por clique no anúncio.
5. Opcional: filtrar tráfego interno (Admin > Fluxos de dados > Configurar
   tag > Definir tráfego interno) com o seu IP, para seus testes não
   contarem.

## 4. Validar (DebugView / Tempo real)

1. Abrir `https://suplescore.com.br/creatina?ga_debug=1&utm_source=teste&utm_medium=manual&utm_campaign=validacao_ga4`.
2. Aceitar os cookies no banner.
3. GA4 > Admin > **DebugView**: o dispositivo aparece com `page_view`.
4. Clicar num "Ver oferta". Em DebugView aparece `outbound_link_clicked`
   com os parâmetros da tabela da §1. A loja abre numa nova aba
   normalmente.
5. Em **Relatórios > Tempo real**, o evento também aparece em "Contagem
   de eventos por nome" (com atraso de segundos).
6. Opcional (DevTools > Rede, filtro `collect`): o hit tem
   `en=outbound_link_clicked` e `ep.product_slug=...`.

Esse clique de validação vai para a loja de verdade e fica registrado em
`outbound_clicks` com `source` da superfície clicada. Anote o horário
para descontar da análise.

## 5. Limitações conhecidas

- **Consentimento (LGPD)**: quem recusa ou ignora o banner **não** gera
  eventos no GA4. Os números do GA4 ficam abaixo dos de `outbound_clicks`
  (que contam tudo). Para campanha, compare as duas fontes: a proporção
  entre elas é a taxa de consentimento. Mudar para Consent Mode v2
  (pings sem cookie antes do aceite) é uma decisão jurídica e de produto,
  não foi feita.
- **Aceite depois de trocar de página**: coberto pela preservação de
  UTM/`gclid` (§1), dentro da mesma aba. Sessão nova (outra aba ou
  janela) sem UTM na URL não herda a campanha.
- **`was_affiliate`** reflete a oferta no momento da renderização. Se o
  afiliado mudar entre a renderização e o clique, o `/go` é quem decide o
  destino real; `outbound_clicks.wasAffiliate` segue sendo a fonte da
  verdade.
- **Bloqueadores de anúncio** bloqueiam o `gtag.js`: sem evento, mas o
  `/go` funciona normalmente.
