import { z } from "zod";

export const createLeadSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  source: z.string().min(1).max(64),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
