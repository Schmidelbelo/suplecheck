"use client";

import * as React from "react";
import { useLocalStorageList } from "@/hooks/useLocalStorageList";

const HISTORY_STORAGE_KEY = "suplecheck:recently-viewed";
const HISTORY_MAX_ITEMS = 10;

const COMPARISONS_STORAGE_KEY = "suplecheck:recent-comparisons";
const COMPARISONS_MAX_ITEMS = 5;

export interface ViewedProductEntry {
  readonly slug: string;
  /** Visita mais recente. */
  readonly viewedAt: number;
  readonly firstViewedAt: number;
  readonly visitCount: number;
}

/**
 * Últimos produtos visitados — só guarda `slug` + timestamps/contagem.
 * Os dados de exibição (nome, marca, nota, imagem) são resolvidos a
 * partir do ranking real no momento da renderização (`/minha-area`),
 * nunca congelados em `localStorage` — evita mostrar nota/preço
 * desatualizado de uma visita antiga.
 *
 * `recordVisit` faz upsert por slug: `push` do hook genérico já dedupe
 * por chave, mas sempre SUBSTITUI o item — aqui somamos `visitCount` e
 * preservamos `firstViewedAt` antes de delegar ao `push`, para que
 * reabrir um produto já visto vire "visitei de novo", não "esqueci que
 * já tinha visto".
 */
export function useRecentlyViewed() {
  const list = useLocalStorageList<ViewedProductEntry>(HISTORY_STORAGE_KEY, {
    maxItems: HISTORY_MAX_ITEMS,
    keyOf: (item) => item.slug,
  });

  const recordVisit = React.useCallback(
    (slug: string) => {
      const existing = list.items.find((item) => item.slug === slug);
      const now = Date.now();
      list.push({
        slug,
        viewedAt: now,
        firstViewedAt: existing?.firstViewedAt ?? now,
        visitCount: (existing?.visitCount ?? 0) + 1,
      });
    },
    [list],
  );

  return { ...list, recordVisit };
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
