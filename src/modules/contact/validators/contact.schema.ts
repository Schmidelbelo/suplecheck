import { z } from "zod";

export const createContactMessageSchema = z.object({
  name: z.string().min(2, "Informe seu nome").max(120),
  email: z.string().email("Informe um e-mail válido"),
  subject: z.enum(["duvida", "sugestao-produto", "parceria", "erro-dado", "outro"]),
  message: z.string().min(10, "Conte um pouco mais (mínimo 10 caracteres)").max(4000),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
