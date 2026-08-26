# SupleCheck — Arquitetura Técnica

> Documento vivo. Define a arquitetura completa da plataforma, da Fase 0 (landing page) até o produto final (comparador inteligente com área de usuário, painel admin, API própria e programa premium). Toda decisão de estrutura abaixo é feita pensando no produto final — a Fase 0 é um subconjunto funcional dessa arquitetura, não uma base descartável.

## 1. Visão de produto e fases

| Fase             | Escopo                                                                                        | Objetivo                                                |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Fase 0** (MVP) | Landing page, Índice SupleCheck, ranking manual de 10 creatinas, captura de e-mail, analytics | Validar proposta de valor e começar a coletar audiência |
| **Fase 1**       | Múltiplas categorias, dezenas de produtos, busca/filtro                                       | Expandir catálogo                                       |
| **Fase 2**       | Comparador inteligente (side-by-side, scoring automático)                                     | Diferencial competitivo                                 |
| **Fase 3**       | Histórico de preços, alertas                                                                  | Retenção                                                |
| **Fase 4**       | Área do usuário, favoritos                                                                    | Conta e engajamento                                     |
| **Fase 5**       | Painel administrativo                                                                         | Operação interna sem deploy                             |
| **Fase 6**       | Programa premium                                                                              | Monetização direta                                      |
| **Fase 7**       | API própria, afiliados                                                                        | Monetização indireta, ecossistema                       |
| **Contínuo**     | SEO avançado, performance                                                                     | Aquisição orgânica sustentável                          |

Todas as fases compartilham o **mesmo schema de dados, o mesmo design system e a mesma estrutura de módulos** — a diferença entre fases é _quais telas/rotas estão habilitadas_, não a arquitetura subjacente.

---

## 2. Stack tecnológica

- **Framework**: Next.js (App Router) — SSR/SSG nativo para SEO, rotas de API embutidas (evolui para a API própria da Fase 7), React Server Components para performance.
- **Linguagem**: TypeScript estrito em 100% do código (front, back, scripts).
- **Banco de dados**: PostgreSQL (via Supabase ou similar) — relacional, porque produtos/categorias/preços/usuários têm relações fortes e precisam de queries analíticas (rankings, histórico).
- **ORM**: Prisma — schema único versionado, migrations, tipagem gerada automaticamente compartilhada entre app e scripts internos.
- **Autenticação**: Auth gerenciado (Supabase Auth/Clerk/NextAuth) — adiado para Fase 4, mas o schema de `User` nasce pronto desde a Fase 0 (captura de e-mail já popula essa tabela).
- **Estilo**: Tailwind CSS + tokens de design centralizados — permite consistência visual e componentes reutilizáveis desde o início.
- **Analytics**: camada de abstração própria (`lib/analytics`) sobre um provedor (Plausible/PostHog/GA4) — nunca chamar o SDK do provedor direto nos componentes, para poder trocar de provedor sem reescrever telas.
- **E-mail/CRM**: provedor de e-mail transacional/marketing (Resend, ou similar) abstraído atrás de `lib/email`.
- **Hospedagem**: Vercel (ou equivalente) — deploy automático, edge functions para performance global.
- **Testes**: Vitest (unitário) + Playwright (E2E) desde o início, mesmo que a Fase 0 tenha poucos testes — a infraestrutura de teste nasce configurada.

---

## 3. Estrutura de pastas

Estrutura pensada para **monorepo modular desde o dia 1**, mesmo a Fase 0 rodando como um único app Next.js. Isso evita reescrita quando a API própria e o painel admin nascerem.

```
suplecheck/
├── apps/
│   ├── web/                      # App principal (público): landing, catálogo, comparador, conta
│   │   ├── src/
│   │   │   ├── app/               # App Router (rotas)
│   │   │   │   ├── (marketing)/   # Landing, sobre, blog — grupo de rota público, otimizado p/ SEO
│   │   │   │   ├── (catalog)/     # /categorias, /produtos, /[categoria]/[produto]
│   │   │   │   ├── (compare)/     # /comparar
│   │   │   │   ├── (account)/     # /conta, /favoritos, /alertas — protegido (Fase 4+)
│   │   │   │   └── api/           # Route handlers internos (webhooks, captura de lead)
│   │   │   ├── modules/           # Lógica de domínio por módulo (ver seção 4)
│   │   │   ├── components/        # Componentes de UI reutilizáveis (ver seção 5)
│   │   │   ├── lib/                # Integrações e utilitários transversais (analytics, email, db client)
│   │   │   ├── styles/
│   │   │   └── config/             # Feature flags, constantes de ambiente
│   │   └── public/
│   ├── admin/                     # Painel administrativo (Fase 5) — app Next.js separado, mesmo design system
│   └── api/                       # API própria pública (Fase 7) — pode nascer como rotas dentro de web/api
│                                    # e ser extraída para cá quando precisar de versionamento/API keys dedicados
├── packages/
│   ├── database/                  # schema.prisma, migrations, seed scripts — fonte única de verdade dos dados
│   ├── ui/                        # Design system compartilhado (componentes puros, sem lógica de domínio)
│   ├── core/                      # Tipos, regras de negócio e cálculos puros (ex: scoring do comparador)
│   ├── analytics/                 # Wrapper de eventos, compartilhado entre web/admin
│   └── config/                    # ESLint, TSConfig, Tailwind config compartilhados
├── scripts/                       # Scripts de importação/curadoria de produtos, seed de ranking manual
└── docs/
    └── ARCHITECTURE.md            # este arquivo
```

**Por que monorepo desde a Fase 0?** Porque `admin` e `api` vão nascer inevitavelmente (Fases 5 e 7), e ambos precisam do mesmo `packages/database` e `packages/ui`. Adiar o monorepo significa, no futuro, extrair código de dentro de um app monolítico sob pressão — mais caro que começar certo. Na Fase 0, `apps/admin` e `apps/api` simplesmente não existem como pastas ainda, mas a convenção já está definida.

---

## 4. Módulos de domínio (`modules/`)

Cada módulo é uma fatia vertical de domínio, não uma camada técnica. Um módulo contém seus próprios: hooks, server actions/queries, tipos locais, e sub-componentes que não fazem sentido fora dele.

- **`catalog`** — produtos, categorias, atributos, o Índice SupleCheck (fórmula de score). Fase 0 já usa este módulo (10 creatinas = catálogo com 1 categoria).
- **`compare`** — motor de comparação (Fase 2), consome `catalog` e `core` (regras de scoring).
- **`pricing`** — histórico de preços, integrações com lojas/afiliados (Fase 3 e 7).
- **`user`** — conta, autenticação, perfil (Fase 4).
- **`favorites`** — relação usuário↔produto (Fase 4).
- **`alerts`** — regras de notificação sobre `pricing` (Fase 3).
- **`leads`** — captura de e-mail (Fase 0!) — já modelado como módulo próprio, não como um form solto na landing, porque vira a base do CRM/e-mail marketing depois.
- **`premium`** — planos, billing, gating de features (Fase 6).
- **`admin`** — CRUD de produtos/categorias/curadoria, exclusivo de `apps/admin` (Fase 5).

Regra: **um módulo nunca importa componentes de UI de outro módulo diretamente** — compartilhamento visual passa por `packages/ui`. Isso mantém os módulos independentes o suficiente para, no futuro, virarem serviços separados se necessário (não é o plano agora, mas a arquitetura não impede).

---

## 5. Componentes e design system

Três camadas, de baixo para cima:

1. **`packages/ui`** — componentes puros, sem conhecimento de domínio (`Button`, `Card`, `Badge`, `Input`, `Rating`, `Table`). Recebem dados via props, nunca fazem fetch, nunca sabem o que é "creatina".
2. **`apps/web/components`** — composições de UI genéricas mas específicas do produto (`ProductCard`, `ScoreBadge`, `LeadCaptureForm`, `RankingTable`) — usam `packages/ui` por baixo, mas já falam a linguagem do domínio.
3. **`apps/web/modules/*/components`** — componentes específicos de uma tela/fluxo de um módulo, não reutilizados fora dele.

Convenção: se um componente é usado em 2+ módulos, ele sobe de nível (de módulo → `components/` → `packages/ui` se for genérico o bastante). Nunca o contrário sob pressão de prazo (duplicar 1 componente pequeno é mais barato que uma abstração errada).

---

## 6. Padrão de nomenclatura

- **Arquivos de componente React**: `PascalCase.tsx` (`ProductCard.tsx`).
- **Hooks**: `useCamelCase.ts` (`useProductRanking.ts`).
- **Server actions/queries**: verbo + entidade, `camelCase`, sufixo de intenção: `getProducts`, `getProductBySlug`, `createLead`, `updateProductScore`.
- **Tipos/Interfaces**: `PascalCase`, sem prefixo `I` (`Product`, não `IProduct`). Tipos de input/DTO com sufixo explícito: `CreateLeadInput`, `ProductFilters`.
- **Rotas (App Router)**: `kebab-case` nos segmentos de URL (`/categorias/creatina`), grupos de rota entre parênteses não afetam a URL (`(marketing)`).
- **Tabelas do banco**: `snake_case` no plural (`products`, `lead_captures`), padrão Prisma/Postgres.
- **Enums de domínio**: `PascalCase` para o tipo, `SCREAMING_SNAKE_CASE` para os valores (`ProductCategory.CREATINE`).
- **Eventos de analytics**: `snake_case`, verbo no passado, namespaced por módulo: `lead_captured`, `product_viewed`, `comparison_started`.

---

## 7. Padrão de tipagem

- TypeScript **estrito** (`strict: true`), sem `any` — exceções exigem comentário justificando.
- **Fonte única de tipos de dados**: gerados pelo Prisma a partir de `packages/database/schema.prisma`. Nenhum tipo de entidade é redefinido manualmente em `apps/web`.
- Tipos de domínio derivados (ex: `ProductWithScore`) vivem em `packages/core`, compostos a partir dos tipos gerados pelo Prisma, nunca duplicados.
- Validação de fronteira (formulários, API routes, webhooks) com **Zod**, e o tipo TS é inferido do schema Zod (`z.infer<typeof CreateLeadSchema>`) — uma única definição, não duas.
- Server actions tipam explicitamente input e output — nunca `any` implícito em retorno.

---

## 8. Modelagem de dados (visão inicial, extensível)

Desenhada para suportar o produto final, populada minimamente na Fase 0.

```
Category        (id, slug, name, description, parentId?)      → suporta subcategorias futuras
Product          (id, slug, categoryId, name, brand, imageUrl, attributes JSON)
ProductScore     (productId, index, breakdown JSON, calculatedAt)  → Índice SupleCheck versionado no tempo
PriceEntry       (productId, storeId, price, capturedAt)       → base do histórico de preços (Fase 3), vazio na Fase 0
Store            (id, name, affiliateBaseUrl)                  → base de afiliados (Fase 7)
Lead             (id, email, source, createdAt)                → captura de e-mail da Fase 0 já normalizada
User              (id, email, ...)                              → Fase 4, mas Lead→User é uma migração natural (mesmo e-mail)
Favorite          (userId, productId)                           → Fase 4
Alert             (userId, productId, condition, active)        → Fase 3/4
```

Decisão chave: **`Lead` e `User` são entidades separadas desde o início**, ligadas por e-mail. Isso evita que a captura de e-mail da landing (Fase 0) precise de um cadastro completo, e permite migrar um lead para usuário completo depois sem retrabalho de schema.

`ProductScore` é separado de `Product` e versionado por `calculatedAt` — o "Índice SupleCheck" da Fase 0 já nasce como um cálculo rastreável no tempo, não um campo estático, porque isso é exatamente o que vira histórico/gráfico de score depois.

---

## 9. Estratégia de SEO

- **SSR/SSG por padrão** via App Router — páginas de produto e categoria geradas estaticamente (ISR) com revalidação, não client-rendered.
- **URLs semânticas e estáveis desde a Fase 0**: `/creatina`, `/creatina/[slug-do-produto]` — a categoria já entra na URL mesmo com 1 categoria só, para não quebrar URLs quando novas categorias chegarem.
- **Metadata API do Next.js** centralizada em `lib/seo` — geração de `<title>`, `description`, Open Graph e JSON-LD (schema.org `Product`, `Review`, `AggregateRating`) a partir dos dados do produto, não hardcoded por página.
- **Sitemap e robots.txt dinâmicos**, gerados a partir do banco (`app/sitemap.ts`), crescem automaticamente com o catálogo.
- **Conteúdo editorial** (blog/guias) já modelado como grupo de rota `(marketing)` desde a Fase 0, mesmo que vazio, para não competir estruturalmente depois com `(catalog)`.
- Core Web Vitals como requisito não-funcional constante (ver Performance).

---

## 10. Estratégia de performance

- **RSC (React Server Components) por padrão**; `"use client"` só onde há interatividade real (formulário de lead, filtros, comparador).
- **Streaming e Suspense** para partes lentas da página (ex: ranking calculado) sem bloquear o first paint.
- **Imagens**: `next/image` obrigatório, com CDN de imagens de produto desde a Fase 0 (evita retrabalho quando o catálogo crescer para centenas de produtos).
- **ISR (Incremental Static Regeneration)** em páginas de produto/categoria — regeneram sob demanda, não em cada request, mesmo quando o catálogo tiver centenas de itens.
- **Cache em camadas**: cache de query no banco (Prisma + cache de leitura) para cálculos de score/ranking que não mudam a cada request.
- Orçamento de performance definido desde já: LCP < 2.5s, CLS < 0.1 — validado em CI (Lighthouse CI) antes de crescer o catálogo tornar isso mais difícil de corrigir retroativamente.

---

## 11. Estratégia de escalabilidade

- **De 10 para centenas de produtos**: o schema (`Category`/`Product`/`ProductScore`) já é relacional e paginável — a Fase 0 lista 10 produtos com a mesma query que listaria 500, apenas sem paginação visível ainda.
- **De 1 para dezenas de categorias**: `Category` já suporta `parentId` para hierarquia (categoria → subcategoria) mesmo que não usado na Fase 0.
- **Curadoria manual → curadoria assistida**: o ranking da Fase 0 é preenchido manualmente via `scripts/seed`, mas grava nas mesmas tabelas (`Product`, `ProductScore`) que uma futura importação automatizada/admin (Fase 5) vai popular — trocar "quem escreve" não muda "onde e como os dados vivem".
- **Comparador inteligente**: a lógica de scoring vive em `packages/core` como funções puras e testáveis, desacopladas de UI e de banco — reusável tanto no ranking simples (Fase 0) quanto no comparador (Fase 2) quanto numa futura API pública (Fase 7).
- **Área do usuário/premium**: gating de feature centralizado (`lib/entitlements` ou similar) que módulos consultam (`user.isPremium`) em vez de checar `plan === 'premium'` espalhado pelo código — permite adicionar planos sem caçar checagens.
- **API própria**: como as rotas internas (`app/api`) já seguem contrato tipado com Zod desde a Fase 0 (ex: endpoint de captura de lead), a extração para uma API pública versionada (Fase 7) é uma questão de expor contratos já existentes com autenticação por API key, não de redesenhar endpoints.
- **Painel admin**: por já existir `packages/ui` e `packages/database` compartilhados, `apps/admin` nasce na Fase 5 como um novo app Next.js fino, sem duplicar design system nem schema.

---

## 12. Feature flags e ativação por fase

`packages/config` define flags simples (`FEATURES.compare`, `FEATURES.userAccounts`, `FEATURES.premium`) lidas por variável de ambiente. Rotas/módulos de fases futuras podem existir no código antes de estarem prontas para produção, protegidas por flag — evita branches de longa duração e permite mesclar trabalho incremental na `main` com segurança.

---

## 13. Resumo das decisões-chave e o porquê

| Decisão                                       | Motivo                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Monorepo desde a Fase 0                       | Admin e API própria são certos no roadmap; extrair depois é mais caro que separar agora |
| `Lead` separado de `User`                     | Captura de e-mail não deve exigir modelo de conta completo, mas deve migrar sem atrito  |
| `ProductScore` versionado, não campo estático | O "Índice" vira histórico/gráfico naturalmente, sem migração de schema depois           |
| Categoria na URL mesmo com 1 categoria        | Evita quebrar SEO ao adicionar categorias                                               |
| Scoring como função pura em `packages/core`   | Reusa entre ranking simples, comparador e futura API sem duplicar regra de negócio      |
| Design system em 3 camadas                    | Permite `apps/admin` reusar UI sem herdar lógica de domínio do site público             |
| SSR/SSG + ISR desde o início                  | Custo de performance/SEO cresce exponencialmente se corrigido depois do catálogo grande |

---

## 14. Próxima etapa

Aguardando aprovação desta arquitetura antes de iniciar a implementação da Fase 0 (scaffolding do monorepo, schema inicial no Prisma, e as telas de landing/ranking/captura de e-mail).
