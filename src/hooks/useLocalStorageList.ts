"use client";

import * as React from "react";

/**
 * Lista ordenada (mais recente primeiro) persistida em `localStorage`,
 * com limite de tamanho e deduplicação por chave — base de Histórico de
 * Visitas e Comparações Recentes. Mesma filosofia de
 * `useLocalStorageSet`: nunca lança se `localStorage` estiver
 * indisponível, degrada para memória.
 */
export function useLocalStorageList<T>(
  storageKey: string,
  options: { maxItems: number; keyOf: (item: T) => string },
) {
  const [items, setItems] = React.useState<T[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const { maxItems, keyOf } = options;

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponível — segue com lista vazia em memória.
    }
    setHydrated(true);
    // Só na montagem — `keyOf`/`storageKey` não devem re-disparar a leitura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = React.useCallback(
    (next: T[]) => {
      setItems(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignora — sessão atual continua funcionando só em memória.
      }
    },
    [storageKey],
  );

  /** Insere no topo; remove duplicata existente pela mesma chave (não acumula, só "bump" para o topo). */
  const push = React.useCallback(
    (item: T) => {
      const key = keyOf(item);
      const next = [item, ...items.filter((existing) => keyOf(existing) !== key)].slice(
        0,
        maxItems,
      );
      persist(next);
    },
    [items, keyOf, maxItems, persist],
  );

  const remove = React.useCallback(
    (key: string) => {
      persist(items.filter((item) => keyOf(item) !== key));
    },
    [items, keyOf, persist],
  );

  const clear = React.useCallback(() => persist([]), [persist]);

  return { items, hydrated, push, remove, clear };
}
