# SupleCheck

Plataforma de comparação inteligente de suplementos. Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a arquitetura completa e o raciocínio por trás das decisões estruturais, e [`docs/DEPLOY.md`](./docs/DEPLOY.md) para o processo de deploy em produção.

## Stack

Next.js 15 (App Router) · TypeScript · PostgreSQL (Neon) · Prisma · Zod · Radix UI · Tailwind CSS v4 · Sentry

## Como rodar

Banco de dados: PostgreSQL (Neon) tanto em desenvolvimento quanto em produção — não há mais banco local em arquivo. É necessário ter um projeto Neon (ou outro Postgres acessível) antes do primeiro `npm run dev`.

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL e ADMIN_API_KEY
npm run db:generate
npm run db:migrate     # aplica as migrations no banco apontado por DATABASE_URL/DIRECT_URL
npm run db:seed        # popula categorias/marcas/fabricantes/10 creatinas avaliadas — opcional, mas necessário para ver dados reais em /creatina
npm run dev
```

`ADMIN_API_KEY` é obrigatória para qualquer escrita na API (`POST`/`PUT`/`PATCH`/`DELETE` em `/api/catalog/*` e `/api/evaluation/*`, ver `src/middleware.ts`) — gere um valor com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e envie como header `x-api-key` nas requisições administrativas.

## Scripts

| Script                 | Descrição                                             |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Ambiente de desenvolvimento                             |
| `npm run build`        | Build de produção                                       |
| `npm run start`        | Sobe o build de produção localmente                     |
| `npm run lint`         | ESLint                                                  |
| `npm run format`       | Formata o projeto com Prettier                          |
| `npm run typecheck`    | Checagem de tipos sem build                             |
| `npm test`             | Testes (Vitest) — integração/repository/API contra o Postgres real de `DATABASE_URL` |
| `npm run db:generate`  | Gera o Prisma Client                                    |
| `npm run db:push`      | Sincroniza o schema com o banco sem gerar migration (dev only) |
| `npm run db:migrate`   | Cria/aplica migrations em desenvolvimento                |
| `npm run db:studio`    | Abre o Prisma Studio                                     |
| `npm run db:seed`      | Roda o seed oficial (categorias/marcas/fabricantes/10 creatinas avaliadas/ranking) — idempotente |

Em produção, migrations são aplicadas com `npx prisma migrate deploy` (nunca `migrate dev`), ver `docs/DEPLOY.md`.

## Estrutura

Ver `ARCHITECTURE.md` §3–§13 para a estrutura de pastas, módulos de domínio, design system e estratégias de SEO/performance/escalabilidade.

## Autenticação da API

Não há login de usuário nesta fase (Beta Público) — o catálogo é gerenciado internamente via uma única API Key (`ADMIN_API_KEY`), checada no `src/middleware.ts` para toda escrita em `/api/catalog/*` e `/api/evaluation/*`. `/api/leads` e `/api/contact` permanecem públicos (captura de lead/contato, por design). Sem a env configurada, toda escrita responde `500`; com a env configurada, falta do header `x-api-key` responde `401`, chave incorreta responde `403`.
