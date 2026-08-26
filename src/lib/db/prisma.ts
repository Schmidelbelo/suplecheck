import { PrismaClient } from "@prisma/client";

/**
 * Singleton do PrismaClient. Em desenvolvimento, o Next.js recarrega
 * módulos a cada mudança (HMR) — sem cachear a instância no `global`,
 * cada reload abriria uma nova conexão com o banco.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
