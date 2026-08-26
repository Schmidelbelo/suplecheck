import { z } from "zod";
import { PAGINATION_DEFAULT_PER_PAGE, PAGINATION_MAX_PER_PAGE } from "@/constants";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_MAX_PER_PAGE)
    .default(PAGINATION_DEFAULT_PER_PAGE),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
