import { prisma } from "@/lib/db/prisma";

/** Módulo `favorites` (Fase 4). Relação usuário↔produto. */
export const favoriteService = {
  async listByUser(userId: string) {
    return prisma.favorite.findMany({ where: { userId }, include: { product: true } });
  },
};
