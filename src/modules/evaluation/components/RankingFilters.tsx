"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { RankingEntryCard } from "./RankingEntryCard";
import type { RankingViewEntry } from "../types";

type SortKey = "score" | "price" | "pricePerDose" | "brand";

const SORT_LABELS: Record<SortKey, string> = {
  score: "Nota (maior primeiro)",
  price: "Preço (menor primeiro)",
  pricePerDose: "Preço por dose (menor primeiro)",
  brand: "Marca (A–Z)",
};

const ALL_BRANDS = "__all__";

function sortEntries(entries: readonly RankingViewEntry[], sortBy: SortKey): RankingViewEntry[] {
  const withIndex = entries.map((entry, index) => ({ entry, index }));

  withIndex.sort((a, b) => {
    switch (sortBy) {
      case "price": {
        const priceA = a.entry.product.price?.cents;
        const priceB = b.entry.product.price?.cents;
        if (priceA == null && priceB == null) break;
        if (priceA == null) return 1;
        if (priceB == null) return -1;
        if (priceA !== priceB) return priceA - priceB;
        break;
      }
      case "pricePerDose": {
        const doseA = a.entry.product.price?.pricePerDoseCents;
        const doseB = b.entry.product.price?.pricePerDoseCents;
        if (doseA == null && doseB == null) break;
        if (doseA == null) return 1;
        if (doseB == null) return -1;
        if (doseA !== doseB) return doseA - doseB;
        break;
      }
      case "brand": {
        const cmp = a.entry.product.brand.name.localeCompare(b.entry.product.brand.name, "pt-BR");
        if (cmp !== 0) return cmp;
        break;
      }
      case "score":
      default: {
        if (a.entry.finalScore !== b.entry.finalScore)
          return b.entry.finalScore - a.entry.finalScore;
        break;
      }
    }
    // Empate (ou critério ausente para ambos): preserva a ordem original do ranking.
    return a.index - b.index;
  });

  return withIndex.map(({ entry }) => entry);
}

/**
 * Filtro e ordenação do ranking — inteiramente client-side sobre os
 * dados já entregues pelo Server Component (`/creatina/page.tsx`).
 * Nenhuma chamada de API nova: `entries` já é o snapshot real do
 * ranking, e a posição exibida em cada card (`entry.position`) sempre
 * reflete o rank real por nota, mesmo quando a lista é reordenada aqui
 * por outro critério — reordenar a visualização não recalcula nem
 * reescreve o ranking.
 */
export function RankingFilters({ entries }: { entries: readonly RankingViewEntry[] }) {
  const [sortBy, setSortBy] = React.useState<SortKey>("score");
  const [brand, setBrand] = React.useState<string>(ALL_BRANDS);

  const brands = React.useMemo(() => {
    const unique = new Map<string, string>();
    for (const entry of entries) {
      unique.set(entry.product.brand.slug, entry.product.brand.name);
    }
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [entries]);

  const filtered = React.useMemo(() => {
    const byBrand =
      brand === ALL_BRANDS ? entries : entries.filter((e) => e.product.brand.slug === brand);
    return sortEntries(byBrand, sortBy);
  }, [entries, brand, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <label htmlFor="ranking-sort" className="text-text-muted text-sm font-medium">
            Ordenar por
          </label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
            <SelectTrigger id="ranking-sort" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ranking-brand" className="text-text-muted text-sm font-medium">
            Marca
          </label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger id="ranking-brand" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANDS}>Todas as marcas</SelectItem>
              {brands.map(([slug, name]) => (
                <SelectItem key={slug} value={slug}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p aria-live="polite" className="text-text-muted text-sm">
        {filtered.length === entries.length
          ? `${filtered.length} produtos exibidos`
          : `${filtered.length} de ${entries.length} produtos exibidos`}
      </p>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((entry) => (
            <RankingEntryCard key={entry.product.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="text-text-muted py-8 text-center text-sm">
          Nenhum produto desta marca no ranking atual.
        </p>
      )}
    </div>
  );
}
