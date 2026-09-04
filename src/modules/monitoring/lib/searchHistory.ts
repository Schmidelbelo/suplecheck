"use client";

import { useLocalStorageList } from "@/hooks/useLocalStorageList";

const STORAGE_KEY = "suplescore:search-history";
const MAX_ITEMS = 15;

export interface SearchHistoryEntry {
  readonly term: string;
  readonly searchedAt: number;
}

/** Últimas buscas feitas no ranking (`RankingFilters`) — só termos reais digitados pelo usuário, nunca inferidos. */
export function useSearchHistory() {
  return useLocalStorageList<SearchHistoryEntry>(STORAGE_KEY, {
    maxItems: MAX_ITEMS,
    keyOf: (item) => item.term.toLowerCase(),
  });
}
