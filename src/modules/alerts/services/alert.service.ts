import { prisma } from "@/lib/db/prisma";

/** Módulo `alerts` (Fase 3/4). Regras de notificação sobre `pricing`/`catalog`. */
export const alertService = {
  async listActiveByUser(userId: string) {
    return prisma.alert.findMany({ where: { userId, active: true }, include: { product: true } });
  },
};
