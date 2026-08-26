# SupleCheck

Plataforma de comparação inteligente de suplementos. Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a arquitetura completa e o raciocínio por trás das decisões estruturais.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma · Zod · Radix UI

## Como rodar

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL
npm run db:generate
npm run dev
```

## Scripts

| Script                | Descrição                             |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Ambiente de desenvolvimento           |
| `npm run build`       | Build de produção                     |
| `npm run lint`        | ESLint                                |
| `npm run format`      | Formata o projeto com Prettier        |
| `npm run typecheck`   | Checagem de tipos sem build           |
| `npm run db:generate` | Gera o Prisma Client                  |
| `npm run db:push`     | Sincroniza o schema com o banco (dev) |
| `npm run db:migrate`  | Cria/aplica migrations                |
| `npm run db:studio`   | Abre o Prisma Studio                  |
| `npm run db:seed`     | Roda o seed do banco                  |

## Estrutura

Ver `ARCHITECTURE.md` §3–§13 para a estrutura de pastas, módulos de domínio, design system e estratégias de SEO/performance/escalabilidade.
