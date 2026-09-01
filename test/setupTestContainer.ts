import path from "node:path";
import { buildInfrastructureContainer, type InfrastructureContainer } from "@infrastructure/index";

/**
 * Constrói um `InfrastructureContainer` real apontando para
 * `prisma/test.db` — um SQLite dedicado a testes (mesmas migrations de
 * `prisma/dev.db`, gerado com `DATABASE_URL="file:./test.db" npx prisma
 * migrate deploy`), nunca o banco de desenvolvimento. Repository/
 * Integration/API tests usam isto em vez de mocks — são testes reais
 * contra Prisma + SQLite, não doubles.
 */
export function buildTestContainer(): InfrastructureContainer {
  const dbPath = path.resolve(process.cwd(), "prisma/test.db");
  return buildInfrastructureContainer({
    NODE_ENV: "test",
    NEXT_PUBLIC_SITE_URL: "https://test.local",
    DATABASE_URL: `file:${dbPath}`,
  });
}

/** Sufixo único por execução de teste — evita colisão de slug/gtin entre testes e entre execuções. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
