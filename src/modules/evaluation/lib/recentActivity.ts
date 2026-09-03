"use client";

import { useLocalStorageList } from "@/hooks/useLocalStorageList";

const HISTORY_STORAGE_KEY = "suplecheck:recently-viewed";
const HISTORY_MAX_ITEMS = 10;

const COMPARISONS_STORAGE_KEY = "suplecheck:recent-comparisons";
const COMPARISONS_MAX_ITEMS = 5;

export interface ViewedProductEntry {
  readonly slug: string;
  readonly viewedAt: number;
}

/**
 * Últimos produtos visitados — só guarda `slug` + timestamp. Os dados
 * de exibição (nome, marca, nota, imagem) são resolvidos a partir do
 * ranking real no momento da renderização (`/minha-area`), nunca
 * congelados em `localStorage` — evita mostrar nota/preço desatualizado
 * de uma visita antiga.
 */
export function useRecentlyViewed() {
  return useLocalStorageList<ViewedProductEntry>(HISTORY_STORAGE_KEY, {
    maxItems: HISTORY_MAX_ITEMS,
    keyOf: (item) => item.slug,
  });
}

export interface ComparisonEntry {
  readonly slugs: readonly string[];
  readonly comparedAt: number;
}

function comparisonKey(slugs: readonly string[]): string {
  return [...slugs].sort().join(",");
}

/** Últimas comparações abertas pelo usuário — mesma lógica de "dados frescos, não congelados" do histórico. */
export function useRecentComparisons() {
  const list = useLocalStorageList<ComparisonEntry>(COMPARISONS_STORAGE_KEY, {
    maxItems: COMPARISONS_MAX_ITEMS,
    keyOf: (item) => comparisonKey(item.slugs),
  });

  return {
    ...list,
    remove: (slugs: readonly string[]) => list.remove(comparisonKey(slugs)),
  };
}
