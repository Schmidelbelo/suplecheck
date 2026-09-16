# BETA_OPERACIONAL.md — Manual de Operação do Beta Público

**Fonte canônica de prontidão para o corte de produção**: `docs/READINESS_PRODUCAO_BETA.md` — status técnico atual, env vars, comandos, procedimento de imagens/afiliados, smoke test e ordem exata de deploy vivem lá, não aqui. Este documento é o complemento operacional do **dia a dia depois que o Beta já está no ar**: checklist diário, rollback, monitoramento, suporte, coleta de feedback, plano de evolução e KPIs — conteúdo que não existe no documento de prontidão porque não é sobre o corte de deploy em si.

Complementa, sem substituir, `OPERACAO_BETA.md` (como publicar catálogo/preço/categoria/marca/produto) e `docs/DEPLOY.md` (referência técnica completa de variável de ambiente, cron, Sentry).

Nenhum item abaixo descreve uma funcionalidade que não existe. Onde algo depende de uma ferramenta externa que a equipe ainda não decidiu (ex.: onde registrar bugs), o documento diz isso explicitamente em vez de inventar uma ferramenta. Números de estado técnico (testes passando, cobertura de monetização, categorias reais) não são repetidos aqui — mudam a cada sprint e `docs/READINESS_PRODUCAO_BETA.md §1` é sempre a versão atual.

---

## 1. Checklist de Deploy e Pós-Deploy

Movido para `docs/READINESS_PRODUCAO_BETA.md`:

- Checklist pré-deploy (código/build, variáveis de ambiente, infraestrutura, segurança) → §5 (env vars), §6 (comandos), §10 (ordem exata de deploy).
- Smoke test pós-deploy (home, `/ofertas`, ranking, produto, `/admin/monetizacao`, `/admin/imagens`, `/robots.txt`, `/sitemap.xml`, clique `/go`) → §9.
- Riscos de infraestrutura (Neon autosuspend, limite de conexões do pooler) → §4.1.

Cobertura adicional que **não** está no documento de prontidão (mais detalhada, útil numa auditoria de regressão pós-deploy, não obrigatória a cada corte):

- **Trust Center/institucional**: `/confianca`, `/faq`, `/sobre`, `/metodologia`, `/como-ganhamos-dinheiro`, `/politica-editorial`, `/politica-de-correcoes`, `/fontes`, `/independencia-editorial`, `/aviso-medico` respondem 200.
- **LGPD**: banner de consentimento aparece na primeira visita (sem cookie `suplescore-cookie-consent`); "Aceitar" carrega GA4/Clarity e persiste o cookie; "Recusar" não carrega nenhum script de analytics.
- **Observabilidade**: `/api/health` responde 200 com `status: "healthy"` nos indicadores `database` e `process-memory`; um erro de teste proposital aparece no Sentry em poucos minutos.
- **Proteção de rotas**: `/api/admin/jobs`, `/api/admin/metrics`, `/api/cron/price-capture`, `/api/cron/uptime-check` respondem 401 sem header, 403 com chave errada, 200 com a chave certa; `/api/leads`, `/api/contact` e `/go/{slug}` aplicam rate limit (6ª requisição rápida em `/api/leads`/`/api/contact`, 21ª em `/go` devem vir 429).

---

## 2. Checklist Diário (durante o Beta)

Rotina leve, pensada para levar poucos minutos por dia — não é uma auditoria completa, é uma varredura de sinais vitais.

- [ ] **`/api/health`** — abrir e confirmar `status: "healthy"` ou, no mínimo, não `"unhealthy"`. Se `"degraded"`, ler qual indicador está degradado (hoje o indicador `price-capture` fica `degraded` sempre que a última execução passou de ~24h — esperado enquanto o cron não estiver ativo, não é alarme).
- [ ] **Painel do Sentry** — algum erro novo desde a última checagem? Priorizar por volume (um erro que afeta 50 sessões é mais urgente que um que afeta 1).
- [ ] **`/admin/metrics`** (com `ADMIN_API_KEY`) — cliques totais do dia, produtos sem nenhum clique, lojas sem nenhum clique. Um número de cliques muito fora do padrão (zero total, ou um pico anômalo) é sinal de algo quebrado, não só de variação de tráfego.
- [ ] **Analytics (GA4/Clarity)**, se configurados — visitas do dia, páginas mais acessadas, alguma sessão gravada no Clarity que mostre um usuário travado/confuso.
- [ ] **E-mails/leads recebidos** (se Resend estiver ativo) — algum lead capturado que precise de resposta humana.
- [ ] **Domínio/certificado** — confirmar visualmente (basta abrir o site) que HTTPS continua válido; certificados gerenciados (Vercel) renovam sozinhos, mas vale um olhar.

---

## 3. Plano de Rollback

O projeto está na Vercel (deploy) + Neon (banco) — as duas camadas têm estratégias de rollback diferentes.

### 3.1 Rollback de código (rápido, minutos)

1. No painel da Vercel, ir em **Deployments**, localizar o último deploy estável anterior ao problemático.
2. Clicar em **"Promote to Production"** (ou equivalente) nesse deploy anterior — a Vercel mantém builds anteriores prontos, não é necessário rebuildar.
3. Confirmar no painel que o deploy promovido é o ativo.
4. Rodar o **smoke test pós-deploy** (`docs/READINESS_PRODUCAO_BETA.md §9`, mais os itens complementares da §1 deste documento) contra produção para confirmar que o rollback resolveu o problema.
5. Se o rollback foi por causa de um commit específico, reverter esse commit na branch principal (`git revert`) **depois** de já ter promovido o deploy anterior — nunca o contrário, para não ficar sem nenhuma versão estável no ar enquanto resolve o git.

### 3.2 Rollback de banco (mais lento, requer cuidado)

O Neon oferece Point-in-Time Recovery (PITR) — branch de restauração a partir de qualquer timestamp dentro da janela de retenção do plano.

1. **Nunca restaurar direto em produção primeiro.** Seguir `OPERACAO_BETA.md §7`: criar um branch Neon temporário a partir do timestamp desejado.
2. Validar esse branch temporário (rodar `npx prisma validate`, `npx prisma migrate status`, conferir os dados) antes de qualquer promoção.
3. Só trocar `DATABASE_URL`/`DIRECT_URL` de produção para o branch restaurado depois da validação.
4. **Risco conhecido**: uma restauração de banco desfaz qualquer dado real criado depois do timestamp escolhido (leads, cliques, produtos publicados). Avaliar se o problema realmente exige rollback de banco ou se é só rollback de código — a maioria dos bugs de aplicação não corrompe dado, só comportamento.

### 3.3 Quando NÃO fazer rollback

- Se o problema é um erro cosmético/não-bloqueador (ex.: um ícone errado), corrigir para frente (hotfix) é mais rápido e seguro que reverter.
- Se o problema afeta só uma funcionalidade isolada (ex.: um formulário específico), considerar desativar só aquela funcionalidade (feature-flag manual via variável de ambiente, se existir) antes de reverter todo o deploy.

### 3.4 Critério de decisão rápida

| Sintoma                                      | Ação                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Site fora do ar / erro 500 generalizado      | Rollback de código imediato                                                                                            |
| Dado incorreto/corrompido visível ao usuário | Investigar se é bug de código (rollback de código) ou dado real ruim (correção pontual de dado, não rollback de banco) |
| Erro isolado em uma página/funcionalidade    | Hotfix direcionado, sem rollback                                                                                       |
| Suspeita de perda/corrupção de dado no banco | Parar de escrever (ninguém roda script administrativo), avaliar PITR do Neon antes de qualquer outra ação              |

---

## 4. Plano de Monitoramento

### 4.1 Erros

- **Fonte**: painel do Sentry (client, server e edge — os três já capturam, ver `docs/DEPLOY.md §6`).
- **O que olhar**: volume de eventos/dia, taxa de erro por release (a Vercel e o Sentry podem ser correlacionados por commit), erros novos vs. recorrentes.
- **Frequência**: diária (checklist §2); em tempo real se houver alerta configurado no painel do Sentry.

### 4.2 Uptime

- **Fonte hoje**: `/api/health` (manual, via checklist diário) e `/api/cron/uptime-check` (pronto, dispara alerta no Sentry quando `unhealthy` — **ainda não agendado em produção**, decisão pendente de quando ativar).
- **Quando ativar o agendamento**: adicionar ao `vercel.json` o bloco documentado em `docs/DEPLOY.md §5d` (`{"crons": [{"path": "/api/cron/uptime-check", "schedule": "*/10 * * * *"}]}`) — recomendado assim que o volume de usuários justificar não depender só da checagem manual diária.
- **Alternativa sem código**: cadastrar `/api/health` num monitor externo gratuito (UptimeRobot, Better Stack) — zero implementação, só configuração de conta, fora deste repositório.

### 4.3 Acessos e páginas mais visitadas

- **Fonte**: GA4 (se configurado e se o visitante aceitou o banner de cookies — alguns acessos reais não aparecerão, é o trade-off correto de privacidade) e Microsoft Clarity (gravação de sessão, mapa de calor).
- **O que olhar**: visitantes/dia, páginas mais acessadas, taxa de rejeição, de onde vem o tráfego (orgânico vs. direto vs. social).

### 4.4 CTR dos afiliados

- **Fonte**: `/admin/metrics` (painel) ou `GET /api/admin/metrics` (API, com `ADMIN_API_KEY`).
- **O que está disponível hoje**: cliques totais, cliques por loja, cliques por produto, cliques por categoria, produtos sem clique, lojas sem clique — ver `docs/READINESS_PRODUCAO_BETA.md §1` para o estado atual da cobertura de monetização (número exato muda a cada loja ativada, não repetido aqui).
- **O que NÃO está disponível ainda**: CTR real (cliques ÷ impressões) — não existe rastreamento de impressão/visualização de card hoje. O painel já deixa isso explícito (`ctrNote` na resposta da API) em vez de mostrar um número inventado. Até essa instrumentação existir, o indicador prático é **cliques totais por dia** e **produtos/lojas sem nenhum clique** (sinal de baixo interesse ou de link quebrado).
- **Lembrete importante**: `wasAffiliate: true` só aparece para cliques em lojas com `isAffiliate=true` e `affiliateBaseUrl` configurado — hoje isso já é verdade para pelo menos uma loja (ver `docs/READINESS_PRODUCAO_BETA.md §2`); demais lojas seguem gravando `wasAffiliate: false` até a aprovação comercial de cada programa (ver `AFFILIATES.md`/`docs/GESTAO_AFILIADOS.md`), não é um bug.

### 4.5 Tempo de resposta

- **Fonte hoje**: nenhuma ferramenta de campo configurada (Vercel Speed Insights não está ativo — achado da auditoria de Launch Readiness). Sem isso, não há número real a reportar diariamente ainda.
- **Recomendação**: ativar Vercel Speed Insights (ou Lighthouse CI contra a URL de produção) antes ou logo após abrir o Beta, para passar a ter este indicador real em vez de uma estimativa estrutural.

### 4.6 Uso do banco

- **Fonte**: painel do Neon (conexões ativas, uso de storage, compute hours, se o plano for medido por isso).
- **O que olhar diariamente no início**: nada além de uma olhada rápida no painel — não há alerta automatizado de uso de banco configurado hoje.
- **Ponto de atenção já identificado**: limite de conexões do pooler sob concorrência real — ver `docs/READINESS_PRODUCAO_BETA.md §4.1`. Se o painel do Neon mostrar conexões frequentemente próximas do limite do plano, é o sinal de que esse risco já auditado está se materializando.

---

## 5. Plano de Suporte

### 5.1 Problemas esperados nas primeiras semanas (e como identificar cada um rapidamente)

| Problema esperado                                                                        | Como identificar rápido                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cold-start do Neon causando lentidão/erro pontual no primeiro acesso após período ocioso | `/api/health` mostra `database: healthy` na checagem seguinte (o problema é transitório); se um usuário reportar "deu erro", pedir para tentar de novo — se resolver sozinho, é isto                                             |
| Produto sem oferta/preço cadastrado                                                      | Usuário relata link de "Ver oferta" levando para a própria página do produto em vez de uma loja — comportamento correto do sistema (`no_offer`), mas pode parecer bug para quem não sabe; confirmar olhando o produto em questão |
| Usuário não encontra Favoritos/Alertas salvos ao trocar de dispositivo/navegador         | Comportamento esperado hoje — esses dados vivem só em `localStorage`, sem conta de usuário real. Documentar como limitação conhecida ao responder o usuário, não como bug                                                        |
| Usuário pede para ver a página "Minha Área" e não encontra o caminho pelo menu           | `/minha-area` existe mas não está linkada em nenhum lugar do site hoje (achado da auditoria de Launch Readiness) — decidir se isso é intencional antes do lançamento; se não for corrigido, ter uma resposta pronta              |
| E-mail de lead/alerta não chega                                                          | Confirmar se `RESEND_API_KEY` está configurada — sem ela, o envio só é logado, nunca sai de fato                                                                                                                                 |
| Reclamação sobre cookie/privacidade                                                      | Apontar para `/cookies`, `/privacidade` e lembrar que o consentimento é opcional e revogável (limpar o cookie do navegador reabre o banner)                                                                                      |
| Link de afiliado "não parece diferente" de um link normal                                | Esperado para lojas sem programa afiliado ativo ainda — o link de saída é direto, sem comissão, até a aprovação comercial de cada loja (ver `docs/READINESS_PRODUCAO_BETA.md §2`/§3 para quais lojas já têm afiliado ativo hoje) |

### 5.2 Canal de suporte

Este documento não assume nenhuma ferramenta específica de atendimento (não existe chat/helpdesk no código hoje) — o canal real é o formulário `/contato`, que grava em `ContactMessage` e, se `RESEND_API_KEY` estiver configurada, também notifica por e-mail. Decidir e documentar aqui, quando a equipe escolher, se o suporte ao usuário do Beta vai rodar por esse formulário, por e-mail direto, ou por alguma ferramenta externa — **não inventar um processo que não existe ainda**.

---

## 6. Plano de Coleta de Feedback

### 6.1 Como registrar bugs

Não existe hoje um sistema de issue tracking configurado neste repositório (sem `.github/` com templates de issue, por exemplo). Até a equipe decidir uma ferramenta, o caminho mais direto e já funcional é:

1. Qualquer bug reportado por usuário chega via `/contato` (ver seção 5.2) ou é observado direto no Sentry/Clarity.
2. Registrar o bug como um item de texto simples (planilha, documento, ou issue do GitHub do próprio repositório — `gh issue create`, já disponível via o remoto GitHub existente) com: o que aconteceu, passos para reproduzir, página/URL afetada, se há erro correspondente no Sentry (linkar o evento).
3. Classificar por severidade usando a mesma escala já usada nas auditorias desta sessão: Crítico / Alto / Médio / Baixo.

### 6.2 Como registrar sugestões

Mesma mecânica do item 6.1, mas separado por natureza (sugestão ≠ bug) — uma sugestão não tem "passos para reproduzir", tem "o que o usuário queria poder fazer". Recomenda-se manter bugs e sugestões em listas/labels distintas desde o início, mesmo que a ferramenta final ainda não esteja decidida, para não misturar prioridades diferentes.

### 6.3 Como priorizar correções

Usar os mesmos quatro eixos já aplicados nas auditorias deste ciclo — **Severidade** (Crítico/Alto/Médio/Baixo), **Impacto** (quantos usuários afeta), **Esforço** (Pequeno/Médio/Grande) e **Risco** (o que acontece se não for corrigido). Regra prática de priorização:

1. **Crítico + Impacto alto** → hotfix imediato (ver Plano de Evolução, seção 7).
2. **Alto + Esforço pequeno** → resolver na próxima janela de deploy, sem esperar sprint formal.
3. **Médio/Baixo** → entram no backlog normal, priorizados por impacto acumulado (um Médio que 10 usuários reportam pesa mais que um Alto que ninguém notou ainda).
4. Qualquer item que envolva dado de usuário real (privacidade, perda de informação) salta para o topo independentemente da severidade técnica.

---

## 7. Plano de Evolução

Classificação do que vem depois do lançamento, dividido por tamanho de mudança — grounded nos achados reais das auditorias desta sessão (Launch Readiness, Beta Readiness, Gestão de Afiliados), não em itens inventados.

### Hotfixes (correção urgente, sem esperar sprint)

- Qualquer bug Crítico que bloqueie uma funcionalidade central (compra, navegação de catálogo, formulário de contato).
- Erro 500 generalizado ou indisponibilidade real do site.
- Vazamento de dado sensível ou falha de segurança explorável.

### Melhorias pequenas (próximas janelas de deploy, esforço Pequeno)

- Ativar o agendamento do monitor de uptime (`vercel.json`, já documentado em `docs/DEPLOY.md §5d`).
- Adicionar `eslint-plugin-jsx-a11y` ao projeto (achado da auditoria de Launch Readiness — protege contra regressão futura de acessibilidade).
- Trocar a comparação de `ADMIN_API_KEY` em `src/middleware.ts` para `crypto.timingSafeEqual`.
- Decidir o destino de `/minha-area` (linkar no menu ou confirmar acesso só-por-URL intencional).
- Remover ou documentar o propósito dos dois itens de código morto confirmados (`slugify()`, `identifyUser()`).
- Investigar por que `/contato` carrega mais JS que páginas de produto (achado de performance).

### Melhorias médias (próxima sprint temática, esforço Médio)

- Migrar rate limiting de `src/middleware.ts` de memória de processo para um limiter distribuído (Upstash Redis/Vercel KV) — relevante já em 100k usuários/dia por escala, segundo a auditoria de escalabilidade.
- Ativar Vercel Speed Insights / Lighthouse CI contra produção para ter dado real de Core Web Vitals.
- Mover os 6 arquivos de serviço "fantasma" (scaffold de fase futura sem nenhum uso) para uma pasta `_scaffolding/` explícita ou removê-los.
- CI/CD mínimo (lint + typecheck + test + build automatizado por PR) — ainda inexistente.
- Confirmar e, se necessário, ajustar o limite de conexões (`connection_limit`/`pool_timeout`) da `DATABASE_URL` contra o tier real do Neon de produção.

### Grandes funcionalidades (decisão de produto, esforço Grande)

- Autenticação de usuário real — pré-requisito para Favoritos/Alertas funcionarem entre dispositivos.
- Ativação comercial de programas de afiliado adicionais além do já ativo — infraestrutura pronta (`prisma/configureStoreAffiliate.ts` com dry-run), falta só o link/tag real de cada loja aprovada (ver `docs/READINESS_PRODUCAO_BETA.md §3` para a lista priorizada).
- Rastreamento de impressão de card/ranking, para permitir CTR real (hoje só existe contagem de clique).
- Suporte a programas de afiliado por cupom (Adaptogen, Probiótica) — exige uma feature nova, não apenas configuração, porque o modelo atual pressupõe redirecionamento rastreável por URL.
- Testes E2E (Playwright/Cypress) — cobertura hoje é só unit/integration.

---

## 8. KPIs do Beta

| KPI                          | Como medir hoje                                                                                                                 | Meta inicial sugerida                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Visitantes/dia               | GA4 (pós-consentimento)                                                                                                         | Linha de base nas primeiras 2 semanas, sem meta fixa ainda                                                       |
| Usuários recorrentes         | GA4 (métrica de usuários recorrentes/retenção)                                                                                  | A definir após linha de base                                                                                     |
| Páginas por sessão           | GA4                                                                                                                             | A definir após linha de base                                                                                     |
| Tempo médio na página/sessão | GA4 + Clarity (gravações para contexto qualitativo)                                                                             | A definir após linha de base                                                                                     |
| CTR dos afiliados            | `/admin/metrics` (cliques totais, por loja/produto/categoria) — CTR real (cliques/impressão) **não disponível ainda**, ver §4.4 | Acompanhar cliques absolutos/dia até a instrumentação de impressão existir                                       |
| Conversão (clique → venda)   | **Não mensurável hoje** — depende de relatório de comissão da rede de afiliado para cada programa ativo                         | Só definir meta depois que houver volume real de cliques afiliados (ver `docs/READINESS_PRODUCAO_BETA.md §2`/§3) |
| Erros por mil acessos        | Sentry (volume de eventos) ÷ GA4 (acessos) × 1000 — cálculo manual, sem dashboard único ainda                                   | Meta inicial: qualquer erro recorrente (mais de 1% dos acessos) investigado no mesmo dia                         |
| Disponibilidade (uptime %)   | `/api/health` (checagem manual diária) ou monitor externo, se/quando ativado                                                    | Meta inicial: sem indisponibilidade não planejada percebida por usuário real                                     |
| Core Web Vitals              | **Sem dado de campo ainda** — Vercel Speed Insights não está ativo (ver §4.5)                                                   | Ativar a ferramenta é o primeiro passo antes de qualquer meta numérica                                           |

**Nota importante sobre estes KPIs**: vários dependem de ferramentas que já existem no código mas ainda não têm dado real fluindo (Speed Insights) ou de uma peça de negócio que ainda não existe (programa de afiliado ativo, rastreamento de impressão). Isso não é uma lacuna de documentação — é o estado real do projeto. Atualizar este documento conforme cada peça for ativada, marcando a transição de "não mensurável hoje" para um número real.

---

_Este documento cobre operação pós-deploy (rollback, monitoramento, suporte, feedback, evolução, KPIs) — para o estado técnico atual e o corte de deploy em si, a fonte é sempre `docs/READINESS_PRODUCAO_BETA.md`. Atualizar aqui sempre que uma peça citada como "ainda não ativada" for de fato ativada, e sempre que uma nova sprint alterar o comportamento operacional aqui descrito._
