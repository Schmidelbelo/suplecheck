import { prisma } from "@/lib/db/prisma";
import type { CreateLeadInput } from "../validators/lead.schema";

/**
 * Camada de serviço do módulo `leads`: única porta de entrada para
 * regras de negócio de captura de e-mail. Route handlers e futuras
 * server actions chamam este serviço, nunca o Prisma diretamente.
 */
export const leadService = {
  async create(input: CreateLeadInput) {
    return prisma.lead.upsert({
      where: { email: input.email },
      update: {},
      create: { email: input.email, source: input.source },
    });
  },

  async count() {
    return prisma.lead.count();
  },
};
