import { prisma } from "@/lib/db/prisma";
import type { CreateContactMessageInput } from "../validators/contact.schema";

/**
 * Camada de serviço do módulo `contact`: única porta de entrada para
 * persistir mensagens do formulário de Contato — inclui solicitações
 * LGPD (ver `/privacidade`), por isso a mensagem precisa ficar
 * realmente registrada, nunca só simulada no cliente.
 */
export const contactService = {
  async create(input: CreateContactMessageInput) {
    return prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
      },
    });
  },
};
