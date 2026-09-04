# Roadmap 1.0 — SupleScore

> Documento mestre de produto. Organiza tudo o que falta até a versão 1.0 em fases priorizadas. **Não é um documento de arquitetura** (ver `ARCHITECTURE.md`) nem de deploy (ver `docs/DEPLOY.md`/`OPERACAO_BETA.md`) — é o plano de negócio e produto que decide o que construir, em que ordem, e por quê. Última atualização: 2026-09-04, logo após o encerramento da Sprint de Rebranding (`SPRINT_REBRANDING_FINAL.md`).

## Como ler este documento

- Cada fase tem Objetivo, Funcionalidades, Entregas, Critérios de aceite, Impacto esperado, Complexidade, ROI e Dependências.
- "Complexidade" é relativa ao que já existe no código hoje (Pequena/Média/Grande), não um esforço absoluto em dias.
- "ROI" é qualitativo (Baixo/Médio/Alto/Muito Alto) — não há dado histórico de conversão real ainda para calcular ROI numérico; será recalibrado com métricas reais a partir da Fase 2.
- Metas de tráfego/receita são **metas de planejamento**, não previsões garantidas — servem para decidir prioridade, não para prometer resultado a terceiros.
- Este documento assume o estado real do código em 2026-09-04 (ver "Estado atual" abaixo) — não reinventa o que já existe, só organiza o que falta.

## Estado atual (ponto de partida desta versão do roadmap)

**Já entregue e funcionando em produção:**

- Motor de scoring real (Índice SupleScore): 6 critérios ponderados, metodologia versionada, `packages/core` puro e testado.
- Catálogo real: 1 categoria viva (creatina), 10 produtos avaliados, 3 lojas (Amazon, Netshoes, Loja Oficial da Marca — placeholder genérico).
- Páginas públicas: Home, `/creatina` (ranking), `/creatina/[slug]` (produto), `/comparar` + `/comparar/[pair]`, `/marcas` + `/marcas/[slug]`, `/categorias` + `/categorias/[slug]`, `/assistente` (recomendação personalizada), `/minha-area` (dashboard local), `/favoritos`, `/alertas`, `/ofertas`, `/mercado`, e as institucionais (sobre, metodologia, como avaliamos, como ganhamos dinheiro, contato, privacidade, cookies, termos).
- SEO técnico: sitemaps segmentados dinâmicos, `robots.txt`, JSON-LD (`Organization`, `Product`/`Review`, `WebSite`/`SearchAction`), OpenGraph/Twitter Cards gerados via `next/og`.
- Monetização (arquitetura pronta, **nenhum programa de afiliado real ativado ainda**): `/go/[productId]` como único ponto de saída, `outbound_clicks` registrando cada clique, `buildAffiliateUrl()` suporta os dois formatos reais de rede (wrapper Awin/Lomadee/Rakuten e tag-em-query-string estilo Amazon Associates) — falta só a aprovação comercial e o preenchimento de `affiliateBaseUrl`.
- Captura de leads: `/api/leads`, formulário reutilizável em 4 pontos (rodapé, home, criação de alerta, Minha Área) — **nenhum envio de e-mail implementado ainda**.
- Pipeline de preço: existe e roda (`/admin/jobs`, `GET /api/cron/price-capture`), mas o scraper padrão (`LastKnownPriceScraperProvider`) só confirma o último preço conhecido — **não busca preço novo em lojas externas**.
- Observabilidade: Sentry, GA4 e Clarity com hooks já implementados, aguardando os IDs reais serem configurados em produção.
- Rebranding completo: SupleCheck → SupleScore, auditado e encerrado (`SPRINT_REBRANDING_FINAL.md`).

**Não existe ainda (não construído):**

- Conta de usuário / login (tudo hoje é local, via `localStorage` — sem servidor de sessão).
- Painel admin com UI (hoje é só API + `curl`/Postman, protegida por `ADMIN_API_KEY`).
- Envio de e-mail transacional/marketing (variável `RESEND_API_KEY` existe, não usada).
- Qualquer programa de afiliado ativo (todas as lojas com `affiliateBaseUrl` vazio).
- Scraping real de preço em lojas externas.
- Conteúdo editorial (blog/guias).
- Segunda categoria de produto além de creatina.
- Qualquer funcionalidade paga/premium.

---

## FASE 1 — Lançamento Beta

**Objetivo:** Colocar o SupleScore no ar, em produção, com domínio próprio, sem nenhuma pendência que quebre a confiança do primeiro visitante.

**Funcionalidades:**

- Nenhuma funcionalidade nova de produto — esta fase é 100% operacional/infraestrutura e correção de inconsistências já conhecidas.

**Entregas:**

1. DNS de `suplescore.com.br` propagado e confirmado.
2. `NEXT_PUBLIC_SITE_URL` de produção (Vercel) atualizado para o domínio real — só depois do item 1 (ver `SPRINT_REBRANDING_FINAL.md` §5, risco de `/creatina` cair se trocado antes).
3. Checklist completo de `OPERACAO_BETA.md` §8 ("Validar produção") executado e assinado.
4. IDs reais configurados: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
5. Google Search Console e Bing Webmaster Tools com a propriedade `suplescore.com.br` verificada e o sitemap enviado.
6. Perfis de redes sociais (Instagram, LinkedIn, YouTube — hoje só placeholders em `src/config/nav.ts`) criados ou os links removidos até existirem de fato.
7. `.env.production.local` re-sincronizado via `vercel env pull` com permissão de decriptação (hoje tem variáveis sensíveis como placeholder — ver `SPRINT_REBRANDING_FINAL.md` §6).

**Critérios de aceite:**

- `https://suplescore.com.br` (e `www`) resolve, redireciona para a canonical e responde 200.
- Os 18 itens do checklist de `OPERACAO_BETA.md` §8 passam.
- Um erro de teste chega ao Sentry; um `page_view` de teste chega ao GA4; uma sessão de teste é gravada no Clarity.
- Nenhum link do site aponta para um domínio/perfil que não existe de verdade.

**Impacto esperado:** Pré-requisito de tudo — sem isto, nenhuma outra fase tem efeito (não há produto no ar para medir).

**Complexidade:** Pequena — é configuração e checklist, não código novo.

**ROI:** Não aplicável (é o pré-requisito para qualquer ROI existir).

**Dependências:** Compra/posse do domínio `suplescore.com.br` (ação externa, fora do código).

---

## FASE 2 — Primeiros Usuários

**Objetivo:** Validar que pessoas reais conseguem usar o produto do jeito que ele foi desenhado — encontrar, confiar, comparar — e capturar o primeiro sinal real de comportamento (não mais suposição).

**Funcionalidades:**

- Nenhuma funcionalidade nova relevante — foco em remover fricção do que já existe e instrumentar o que falta medir.
- Pequenos ajustes de UX guiados por observação real de uso (sessão gravada via Clarity), não por suposição.

**Entregas:**

1. Revisão de consistência de copy institucional (Hero, FAQ, Como Avaliamos, Metodologia) contra os 6 critérios reais do motor de scoring — checagem pontual, já que a maior inconsistência identificada em `PRODUCT_REVIEW.md` (item #1, "[MISMATCH]") parece resolvida no código atual (`faq.ts` já lista os 6 critérios reais corretamente), mas vale uma auditoria final página a página antes de escalar tráfego.
2. Divulgação inicial controlada (grupos/comunidades de nicho, não paga) para gerar as primeiras dezenas de sessões reais.
3. Análise da primeira safra de sessões no Clarity/GA4: onde o visitante trava, onde abandona, se chega a `/creatina/[slug]`.
4. Primeiros e-mails captados via `/api/leads` — sem envio ainda, só acumulando a base.

**Critérios de aceite:**

- Pelo menos 50 sessões reais registradas no GA4.
- Nenhum erro novo e recorrente no Sentry associado ao fluxo principal (Home → Ranking → Produto → `/go/`).
- Pelo menos 1 rodada de ajuste de UX feita com base em gravação de sessão real (Clarity), não em opinião.

**Impacto esperado:** Alto — é o primeiro contato com a realidade; toda suposição de produto até aqui é teórica.

**Complexidade:** Pequena.

**ROI:** Alto — custo quase zero (divulgação orgânica em nicho), aprendizado direto sobre o funil real.

**Dependências:** Fase 1 completa (produto precisa estar 100% no ar e mensurável).

---

## FASE 3 — Crescimento SEO

**Objetivo:** Transformar o SupleScore de "site com 10 produtos" em uma fonte de tráfego orgânico recorrente — mais superfícies indexáveis, mais intenção de busca capturada.

**Funcionalidades:**

- Expansão de catálogo: 2ª categoria de suplemento (ex.: whey protein), seguindo o mesmo pipeline já usado para creatina (`OPERACAO_BETA.md` §3).
- Conteúdo introdutório rico em páginas de listagem (`/creatina`, futuras categorias) respondendo intenções de busca ("vale a pena", "como escolher").
- Primeiro conteúdo editorial (artigo/guia) linkando para o ranking, iniciando um cluster de SEO.
- Contador/prova social na Home e no Ranking ("X produtos avaliados", data da última atualização).
- Filtro e ordenação no ranking (preço, preço por dose, marca) — hoje implícito pela ordem de score, útil conforme o catálogo cresce.

**Entregas:**

1. Pipeline de nova categoria documentado e executado ao menos uma vez (prova de que o processo de `OPERACAO_BETA.md` funciona além de creatina).
2. 3 a 5 peças de conteúdo editorial publicadas.
3. Filtro/ordenação no ranking implementado e testado.
4. Contador de produtos avaliados visível na Home.

**Critérios de aceite:**

- Ao menos 1 categoria nova, com produtos reais publicados e ranking gerado.
- Google Search Console mostra páginas novas indexadas (não só descobertas).
- Crescimento mês a mês de impressões orgânicas no Search Console (tendência, não número fixo).

**Impacto esperado:** Alto, cumulativo — SEO tem retorno atrasado mas composto; cada categoria/artigo novo aumenta a superfície de captura de tráfego de forma permanente.

**Complexidade:** Média — a arquitetura já suporta múltiplas categorias (`Category.parentId`, sitemaps dinâmicos), o trabalho é de conteúdo/dado, não de código estrutural novo.

**ROI:** Alto no médio prazo, baixo no curto prazo (SEO não converte em semanas).

**Dependências:** Fase 2 (validação de que o funil básico funciona antes de escalar o volume de páginas).

---

## FASE 4 — Monetização

**Objetivo:** Transformar cliques de saída (`/go/[productId]`) em receita real — a arquitetura já existe, falta a aprovação comercial e a ativação.

**Funcionalidades:**

- Nenhuma funcionalidade de código nova relevante — a arquitetura de afiliados já está pronta (`AFFILIATES.md`), incluindo os dois formatos de `affiliateBaseUrl` (wrapper e tag-em-query-string).
- Ativação comercial: aprovação em Amazon Associates e Rakuten Advertising (Netshoes) — as 2 lojas já no catálogo.
- Avaliação de expansão de catálogo para marcas com programa de afiliado confirmado (Growth via Lomadee, Soldiers Nutrition e Dark Lab via Awin — ver `AFFILIATES.md` §8).
- Monitoramento de `outbound_clicks.wasAffiliate` nos primeiros dias de cada ativação.

**Entregas:**

1. Amazon Associates aprovado, `Store.affiliateBaseUrl` da Amazon preenchido no formato `tag=...`.
2. Netshoes/Rakuten Advertising aprovado, `Store.affiliateBaseUrl` preenchido no formato wrapper.
3. Primeira comissão real recebida e conciliada.
4. Decisão tomada (dados de tráfego/clique da Fase 3 embasando) sobre expandir catálogo para as marcas com Awin/Lomadee.

**Critérios de aceite:**

- Pelo menos 1 loja operando como afiliado real em produção (`isAffiliate: true` + `affiliateBaseUrl` real, não vazio).
- `outbound_clicks` confirma cliques saindo como afiliado (`wasAffiliate: true`) nos dias seguintes à ativação.
- Reconciliação financeira validada contra o painel da rede de afiliados (Amazon/Rakuten).

**Impacto esperado:** Muito alto — é a primeira fonte de receita real do produto.

**Complexidade:** Pequena tecnicamente (configuração), Média/Alta comercialmente (aprovação depende de terceiros, fora de controle direto).

**ROI:** Muito alto — custo de implementação já pago (sprint anterior), retorno é 100% incremental a partir daqui.

**Dependências:** Fase 3 em andamento (volume de tráfego/clique é o que dá poder de negociação e o que gera receita de fato — ativar afiliado sem tráfego tem retorno perto de zero).

---

## FASE 5 — Autoridade

**Objetivo:** Consolidar o SupleScore como fonte confiável e citável — o tipo de autoridade que gera backlinks, menções de imprensa/influenciadores do nicho, e reduz a dependência de SEO puro.

**Funcionalidades:**

- Página "Quem somos"/editorial policy fortalecida com credenciais reais de quem assina a metodologia (hoje `/sobre` existe mas — por revisão do `PRODUCT_REVIEW.md` — carece de sinais claros de autoria humana, relevante para E-E-A-T do Google).
- Metodologia pública versionada e citável (já existe o motor versionado — falta a superfície de "citação"/changelog público da metodologia).
- Programa de relacionamento com nicho (nutricionistas, educadores físicos, criadores de conteúdo de suplementação) para gerar menções orgânicas.
- Painel administrativo com UI mínima (hoje só API crua) — necessário para que a curadoria de conteúdo/metodologia escale sem depender de `curl`.

**Entregas:**

1. `/sobre` e `/metodologia` reforçados com autoria/credenciais reais e changelog público de versões da metodologia.
2. Ao menos 3 menções/backlinks externos genuínos conquistados (imprensa de nicho, fóruns especializados, criadores de conteúdo).
3. Painel admin (`apps/admin` conforme já previsto em `ARCHITECTURE.md`) com CRUD básico de produto/categoria/marca substituindo as chamadas manuais de API.

**Critérios de aceite:**

- Domain Authority/backlinks (métrica de terceiro, ex. Ahrefs/Search Console "links externos") em tendência de crescimento.
- Painel admin permite publicar um produto novo sem tocar em `curl`/Postman.

**Impacto esperado:** Alto, mas de retorno lento — autoridade se constrói e se perde devagar.

**Complexidade:** Grande — painel admin é a primeira peça de infraestrutura genuinamente nova desta fase (novo app dentro do monorepo).

**ROI:** Médio no curto prazo, Alto no longo prazo (autoridade composta reduz custo de aquisição de todas as fases seguintes).

**Dependências:** Fase 3 (conteúdo/catálogo maduro o suficiente para merecer citação externa).

---

## FASE 6 — Escala

**Objetivo:** Suportar centenas de produtos, múltiplas categorias vivas e tráfego significativamente maior sem reescrever a base.

**Funcionalidades:**

- Scraping real de preço em lojas externas, substituindo `LastKnownPriceScraperProvider` por um provider que efetivamente busca preço novo (a interface `PriceScraperPort` já existe para isso).
- Envio de e-mail real: ativar `RESEND_API_KEY`, notificações de alerta de preço (o campo `PriceAlert.email` já existe e está reservado para isso desde a sprint de captura de leads).
- Paginação/filtros avançados no ranking (necessário além de dezenas de produtos por categoria).
- CDN de imagens de produto real (hoje placeholder único genérico — `PRODUCT_REVIEW.md` item #13).
- Conta de usuário opcional (login) para sincronizar favoritos/histórico entre dispositivos — hoje 100% local por navegador.

**Entregas:**

1. Provider de scraping real implementado e testado para ao menos as 2 lojas afiliadas ativas.
2. Primeiro e-mail de alerta de preço enviado de verdade.
3. Catálogo com 100+ produtos reais, 3+ categorias vivas.
4. Login opcional funcionando (favoritos/alertas sincronizados entre dispositivos para quem optar).

**Critérios de aceite:**

- Preço exibido no site reflete captura real de loja externa, não só confirmação do último preço conhecido.
- Usuário recebe e-mail real quando o alerta de preço configurado é atingido.
- Catálogo suporta 100+ produtos sem degradação perceptível de performance (Core Web Vitals mantidos).

**Impacto esperado:** Alto — é o que transforma o produto de "MVP de nicho" em plataforma de fato usável em escala.

**Complexidade:** Grande — scraping real e autenticação são os dois maiores itens de arquitetura nova deste roadmap inteiro.

**ROI:** Médio a Alto — custo de implementação alto, mas retenção/confiança aumentam desproporcionalmente com preço real e alertas funcionais.

**Dependências:** Fase 4 (monetização já validada — só faz sentido investir em escala depois de confirmar que o motor de receita funciona) e Fase 5 (autoridade/painel admin, para curar o catálogo maior sem sobrecarregar operação manual).

---

## FASE 7 — Versão 1.0

**Objetivo:** Consolidar tudo entregue nas fases anteriores em uma versão estável, documentada e pronta para ser chamada de "1.0" — o marco em que o SupleScore deixa de ser "produto em validação" e passa a ser "produto em operação".

**Funcionalidades:**

- Nenhuma funcionalidade nova — esta fase é consolidação, hardening e, opcionalmente, a primeira camada paga/premium se o negócio decidir que faz sentido nesse ponto (gating de feature já previsto em `ARCHITECTURE.md`, não implementado).
- API própria versionada (os endpoints internos já seguem contrato tipado com Zod — extração para API pública é expor contrato existente com autenticação por chave, não redesenhar).

**Entregas:**

1. Todas as vulnerabilidades de dependência conhecidas (`npm audit`, hoje 5 pré-existentes em ferramentas de build) resolvidas ou formalmente aceitas com justificativa.
2. Suite de testes E2E (Playwright, já previsto em `ARCHITECTURE.md`, não implementado) cobrindo os fluxos críticos: descobrir produto → comparar → clicar em oferta → (se aplicável) criar alerta.
3. Documentação de produto e operação revisada e consolidada (`ARCHITECTURE.md`, `OPERACAO_BETA.md`, este roadmap).
4. Decisão de negócio tomada, documentada e (se aprovada) implementada sobre premium/plano pago.
5. Tag `v1.0.0` publicada.

**Critérios de aceite:**

- Todas as fases 1–6 com seus critérios de aceite cumpridos.
- Zero vulnerabilidade `high`/`critical` não-justificada em `npm audit`.
- Suite E2E passando em CI antes de cada release.

**Impacto esperado:** Simbólico e operacional — sinaliza maturidade ao mercado e reduz risco técnico acumulado.

**Complexidade:** Média — é principalmente consolidação do que já foi construído, não um salto de arquitetura novo (exceto premium, se decidido).

**ROI:** Depende inteiramente da decisão de premium — sem ele, é investimento em estabilidade (retorno indireto); com ele, é a segunda fonte de receita do produto.

**Dependências:** Todas as fases anteriores.

---

## Backlog Priorizado

(Itens concretos, prontos para virar sprint, fora dos já listados dentro de cada fase — ordenados por prioridade)

1. Auditoria final de consistência de copy institucional vs. os 6 critérios reais (Fase 2 — baixo custo, remove risco de credibilidade).
2. Explicar ou remover o botão "Comparar outras lojas" quando permanentemente desabilitado (`PRODUCT_REVIEW.md` #10) — pequeno, remove confusão.
3. Página de changelog público da metodologia (Fase 5) — pequeno, alto valor de autoridade.
4. Filtro/ordenação do ranking (Fase 3).
5. Contador de produtos avaliados na Home (Fase 3).
6. Painel admin mínimo (Fase 5) — maior item de esforço do backlog priorizado, mas desbloqueia todas as fases seguintes de operação.

## Backlog Opcional

(Vale a pena, mas não bloqueia nenhuma fase — priorizar por oportunidade, não por sequência)

- Fotografia real de produto substituindo placeholder genérico.
- Exportar comparação (PDF/imagem) para compartilhamento.
- Modo escuro (`prefers-color-scheme`) se ainda não coberto pelos design tokens.
- Widget de "produtos similares" na página de produto.
- Internacionalização (hoje 100% pt-BR, hardcoded) — só relevante se houver decisão de expandir mercado.

## Ideias Futuras

(Não compromissadas com nenhuma fase — candidatas a entrar no roadmap em uma futura revisão, dependendo de validação)

- App mobile nativo ou PWA instalável.
- Extensão de navegador ("veja o Índice SupleScore direto na loja").
- API pública paga para desenvolvedores/parceiros consumirem o Índice.
- Parcerias com fabricantes para dados de composição mais ricos (direto da fonte, mantendo a promessa de "sem publicidade paga influenciando o resultado").
- Comunidade/avaliação de usuários como sinal complementar (nunca substituindo o Índice editorial — ver decisão registrada em `src/lib/seo/schema.ts` de nunca usar `AggregateRating`).

## Dívida Técnica

(Consolidado de `SPRINT_REBRANDING_FINAL.md` §7 + itens estruturais conhecidos)

- 5 vulnerabilidades de dependência (`npm audit`) em ferramentas de build (`prisma` CLI via `deepmerge-ts`, `postcss` empacotado no `next`) — correção exige upgrade major, tratar como sprint própria antes da Fase 7.
- `package.json#prisma` deprecated — migrar para `prisma.config.ts` antes do Prisma 7.
- Aviso de configuração do Vite/Vitest (`configLoader: 'native'`) — cosmético, sem efeito funcional ainda.
- `LastKnownPriceScraperProvider` como único provider de preço — limitação conhecida e documentada, endereçada na Fase 6.
- Ausência de testes E2E (Playwright previsto em `ARCHITECTURE.md`, nunca implementado) — endereçada na Fase 7.
- Flakiness recorrente de cold-start do Neon em testes/build locais — comportamento operacional conhecido do provedor serverless, não um bug do código; vale avaliar um plano pago com menos cold-start se a flakiness afetar CI de produção.

## Riscos

| Risco                                                                                  | Fase mais exposta | Mitigação                                                                                                              |
| -------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| DNS não propagar a tempo, atrasando o Beta                                             | Fase 1            | Comprar domínio com folga de tempo antes da data alvo de lançamento                                                    |
| Programa de afiliado (Amazon/Rakuten) reprovado ou demorado                            | Fase 4            | Diversificar candidatos (Awin/Lomadee já mapeados em `AFFILIATES.md`) em vez de depender de 1 única aprovação          |
| Tráfego insuficiente para gerar dado real de comportamento                             | Fase 2/3          | Divulgação em nicho de baixo custo antes de qualquer investimento pago                                                 |
| Scraping de preço real (Fase 6) esbarrar em bloqueio/CAPTCHA das lojas                 | Fase 6            | Priorizar lojas com API de afiliado oficial (que geralmente inclui dado de preço) sobre scraping bruto quando possível |
| Inconsistência de copy vs. metodologia real reaparecer conforme o site cresce          | Todas             | Checklist de auditoria de copy institucional antes de cada release de conteúdo novo                                    |
| Cold-start do Neon afetar disponibilidade real em produção (não só build local)        | Fase 1 em diante  | Monitorar `/api/health` e Sentry; avaliar plano Neon com menos suspensão se volume justificar                          |
| Decisão de premium (Fase 7) mal recebida por uma base acostumada a produto 100% grátis | Fase 7            | Validar com a base de e-mails capturada (Fase 2–6) antes de implementar, não depois                                    |

## Metas de Negócio

- Fase 1: produto em produção, zero pendência crítica aberta.
- Fase 2: primeira validação real de que o funil (descoberta → confiança → clique de saída) funciona com usuário desconhecido, não só com o time.
- Fase 3: SupleScore reconhecido como referência de busca para "creatina" (e a 2ª categoria) no nicho pt-BR.
- Fase 4: primeira receita real e recorrente, mesmo que pequena.
- Fase 5: primeiras menções/citações externas genuínas (fora do controle direto do time).
- Fase 6: catálogo e operação sustentam crescimento sem depender de trabalho manual proporcional.
- Fase 7: produto operando com dívida técnica sob controle e uma decisão de monetização adicional (premium) tomada com dado real.

## Metas de Tráfego

(Metas de planejamento — a recalibrar com dado real a partir da Fase 2, nunca tratadas como número garantido)

- Fase 2: primeiras dezenas de sessões reais mensuradas.
- Fase 3: crescimento mês a mês de impressões orgânicas (tendência sustentada, não pico isolado) no Search Console.
- Fase 4: volume de clique de saída (`outbound_clicks`) suficiente para gerar comissão perceptível.
- Fase 6: tráfego orgânico como canal dominante de aquisição (indicando que SEO composto está funcionando), reduzindo dependência de divulgação manual.

## Metas de Receita

(Também metas de planejamento, não previsão)

- Fase 4: primeira comissão de afiliado recebida e conciliada — o marco em si importa mais que o valor nesta fase.
- Fase 6: receita de afiliados crescendo em linha com o crescimento do catálogo/tráfego (sinal de que o modelo escala, não só de que funciona uma vez).
- Fase 7: decisão de negócio sobre segunda fonte de receita (premium/API paga) tomada com base em dado acumulado das fases anteriores, não antes.

## KPIs por Fase

| Fase                   | KPI principal                                         | Como medir                                                                             |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1 — Lançamento Beta    | Checklist de produção 100% completo                   | `OPERACAO_BETA.md` §8, item a item                                                     |
| 2 — Primeiros Usuários | Sessões reais mensuradas                              | GA4                                                                                    |
| 3 — Crescimento SEO    | Impressões orgânicas (tendência)                      | Google Search Console                                                                  |
| 4 — Monetização        | Cliques de saída como afiliado (`wasAffiliate: true`) | `outbound_clicks` (banco)                                                              |
| 5 — Autoridade         | Backlinks/menções externas                            | Search Console "links externos" + monitoramento manual                                 |
| 6 — Escala             | Produtos com preço capturado por scraping real        | Banco (`PriceEntry` com `source` de scraper real, não `LastKnownPriceScraperProvider`) |
| 7 — Versão 1.0         | Vulnerabilidades `high`/`critical` abertas            | `npm audit`                                                                            |

---

## Como este documento deve ser mantido

- Ele é o documento principal de evolução do produto até 1.0 — decisões de prioridade de sprint devem referenciar a fase correspondente aqui.
- Atualizar a seção "Estado atual" a cada sprint que mudar o que está ou não construído.
- Mover itens do Backlog Priorizado para dentro da fase correspondente conforme forem planejados; nunca implementar direto do backlog sem essa promoção, para manter a rastreabilidade de por que algo foi feito.
- Metas de tráfego/receita devem ser revisadas com dado real a cada fase concluída, nunca tratadas como compromisso fixo definido nesta primeira versão.
