import { buildInfrastructureContainer, type InfrastructureContainer } from "@infrastructure/index";
import { RankingApplicationService } from "@application/index";

/**
 * Singleton do container de DI para o app Next.js — mesma razão do
 * singleton do PrismaClient em `src/lib/db/prisma.ts`: em desenvolvimento
 * o HMR recarrega módulos a cada mudança, e sem cachear no `global` cada
 * reload criaria uma nova `PrismaConnection` (nova pool de conexões).
 *
 * Toda API Route dos módulos Catálogo/Avaliação consome Use
 * Cases/Services através daqui — nunca importa Prisma diretamente (ver
 * ARCHITECTURE.md §3).
 */
const globalForContainer = globalThis as unknown as {
  infraContainer?: InfrastructureContainer;
  rankingService?: RankingApplicationService;
};

export const container = globalForContainer.infraContainer ?? buildInfrastructureContainer();

export const rankingService =
  globalForContainer.rankingService ??
  new RankingApplicationService(container.useCases, container.ports.rankings);

if (process.env.NODE_ENV !== "production") {
  globalForContainer.infraContainer = container;
  globalForContainer.rankingService = rankingService;
}
