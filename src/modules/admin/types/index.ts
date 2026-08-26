/**
 * Módulo `admin` (Fase 5). Tipos de input para CRUD de curadoria —
 * usados futuramente por `apps/admin`, exclusivos desse app.
 */
export interface UpsertProductInput {
  name: string;
  slug: string;
  categoryId: string;
  brandId: string;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
}
