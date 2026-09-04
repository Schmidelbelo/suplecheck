"use client";

import { useLocalStorageList } from "@/hooks/useLocalStorageList";

const STORAGE_KEY = "suplescore:recommendation-history";
const MAX_ITEMS = 10;

export interface RecommendationHistoryEntry {
  /** Query string completa (sem o `?`) — reabre exatamente a mesma recomendação em `/assistente?...`. */
  readonly query: string;
  readonly recommendedProductName: string;
  readonly generatedAt: number;
}

/** Últimas recomendações geradas pelo Assistente — só o suficiente para linkar de volta, nunca a lista de produtos congelada (evita mostrar dado desatualizado). */
export function useRecommendationHistory() {
  return useLocalStorageList<RecommendationHistoryEntry>(STORAGE_KEY, {
    maxItems: MAX_ITEMS,
    keyOf: (item) => item.query,
  });
}
