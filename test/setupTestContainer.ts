import { buildInfrastructureContainer, type InfrastructureContainer } from "@infrastructure/index";

/**
 * Constrói um `InfrastructureContainer` real apontando para o mesmo
 * PostgreSQL (Neon) configurado em `DATABASE_URL`/`.env` — não há mais
 * banco SQLite dedicado a testes (schema único, um só provider, ver
 * `prisma/schema.prisma`). Repository/Integration/API tests usam isto
 * em vez de mocks — são testes reais contra Prisma + PostgreSQL, não
 * doubles. `uniqueSuffix()` evita colisão de slug/gtin com dados de dev
 * já existentes no mesmo banco.
 */
export function buildTestContainer(): InfrastructureContainer {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não configurada — testes de integração precisam do Postgres real (ver .env.example).",
    );
  }
  return buildInfrastructureContainer({
    NODE_ENV: "test",
    NEXT_PUBLIC_SITE_URL: "https://test.local",
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

/** Sufixo único por execução de teste — evita colisão de slug/gtin entre testes e entre execuções. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
