import type { Product } from "@/modules/catalog/types";

/**
 * Motor de comparação (Fase 2). Tipos preparados; lógica de scoring vive
 * futuramente em `packages/core` como funções puras (ver ARCHITECTURE.md §11).
 */
export interface ComparisonCriterion {
  key: string;
  label: string;
  weight: number;
}

export interface ComparisonResult {
  products: Product[];
  criteria: ComparisonCriterion[];
}
