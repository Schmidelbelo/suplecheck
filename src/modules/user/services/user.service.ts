import { prisma } from "@/lib/db/prisma";

/** Módulo `user` (Fase 4). Conta e perfil — autenticação entra aqui quando adotada. */
export const userService = {
  async getByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
};
