"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { SearchBox } from "@/components/shared/SearchBox";
import { RankingEntryCard } from "./RankingEntryCard";
import { CompareBar, MAX_COMPARE } from "./CompareBar";
import { CompareTable } from "./CompareTable";
import { useFavorites } from "./FavoriteButton";
import { useRecentComparisons } from "../lib/recentActivity";
import { useSearchHistory } from "@/modules/monitoring/lib/searchHistory";
import type { RankingViewEntry } from "../types";

type SortKey = "overall" | "score" | "price" | "pricePerDose" | "brand";

const SORT_LABELS: Record<SortKey, string> = {
  overall: "Melhor compra (Score Geral)",
  score: "Maior nota geral (Índice SupleCheck)",
  price: "Menor preço",
  pricePerDose: "Preço por dose (menor primeiro)",
  brand: "Marca (A–Z)",
};

const ALL_BRANDS = "__all__";

function sortEntries(entries: readonly RankingViewEntry[], sortBy: SortKey): RankingViewEntry[] {
  const withIndex = entries.map((entry, index) => ({ entry, index }));

  withIndex.sort((a, b) => {
    switch (sortBy) {
      case "overall": {
        if (a.entry.overallScore !== b.entry.overallScore)
          return b.entry.overallScore - a.entry.overallScore;
        break;
      }
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
const COMPARE_QUERY_PARAM = "comparar";

export function RankingFilters({ entries }: { entries: readonly RankingViewEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = React.useState<SortKey>("score");
  const [brand, setBrand] = React.useState<string>(ALL_BRANDS);
  const [onlyFavorites, setOnlyFavorites] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [compareIds, setCompareIds] = React.useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = React.useState(false);
  const { values: favoriteIds, hydrated: favoritesHydrated } = useFavorites();
  const { push: pushComparison } = useRecentComparisons();
  const { push: pushSearchTerm } = useSearchHistory();
  const pushSearchTermRef = React.useRef(pushSearchTerm);
  pushSearchTermRef.current = pushSearchTerm;

  // Grava a busca no histórico local só depois de uma pausa de digitação
  // (800ms) — evita uma entrada por tecla pressionada, e só termos com
  // 2+ caracteres (ignora buscas de 1 letra, ruído demais para virar
  // insight). `pushSearchTermRef` (não `pushSearchTerm` direto) porque
  // a função é recriada a cada push — incluí-la nas deps causaria um
  // loop (efeito reagenda a si mesmo a cada gravação).
  React.useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    const timeout = setTimeout(() => {
      pushSearchTermRef.current({ term, searchedAt: Date.now() });
    }, 800);
    return () => clearTimeout(timeout);
  }, [search]);

  // Comparação compartilhável: `?comparar=slug-a,slug-b` na URL — lido
  // uma vez ao montar (permite abrir um link enviado por alguém já com
  // a seleção pronta) e reescrito (sem navegação/scroll) a cada mudança,
  // para que o link atual sempre reflita a seleção corrente.
  const didInitFromUrl = React.useRef(false);
  React.useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;
    const slugsParam = searchParams.get(COMPARE_QUERY_PARAM);
    if (!slugsParam) return;
    const slugs = new Set(slugsParam.split(",").filter(Boolean));
    const ids = entries.filter((e) => slugs.has(e.product.slug)).map((e) => e.product.id);
    if (ids.length > 0) setCompareIds(new Set(ids));
  }, [entries, searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (compareIds.size > 0) {
      const slugs = entries.filter((e) => compareIds.has(e.product.id)).map((e) => e.product.slug);
      params.set(COMPARE_QUERY_PARAM, slugs.join(","));
    } else {
      params.delete(COMPARE_QUERY_PARAM);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareIds, entries]);

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
    const byFavorite = onlyFavorites
      ? byBrand.filter((e) => favoriteIds.has(e.product.id))
      : byBrand;
    const term = search.trim().toLowerCase();
    const bySearch = term
      ? byFavorite.filter(
          (e) =>
            e.product.name.toLowerCase().includes(term) ||
            e.product.brand.name.toLowerCase().includes(term),
        )
      : byFavorite;
    return sortEntries(bySearch, sortBy);
  }, [entries, brand, sortBy, onlyFavorites, favoriteIds, search]);

  const compareEntries = React.useMemo(
    () => entries.filter((e) => compareIds.has(e.product.id)),
    [entries, compareIds],
  );

  function toggleCompare(productId: string, checked: boolean) {
    setCompareIds((current) => {
      const next = new Set(current);
      if (checked) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchBox
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por produto ou marca…"
        aria-label="Buscar no ranking de creatinas"
      />

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

        {favoritesHydrated ? (
          <div className="flex items-center gap-2">
            <Switch
              id="ranking-only-favorites"
              checked={onlyFavorites}
              onCheckedChange={setOnlyFavorites}
            />
            <label htmlFor="ranking-only-favorites" className="text-text text-sm font-medium">
              Só favoritos
            </label>
          </div>
        ) : null}
      </div>

      <p aria-live="polite" className="text-text-muted text-sm">
        {filtered.length === entries.length
          ? `${filtered.length} produtos exibidos`
          : `${filtered.length} de ${entries.length} produtos exibidos`}
      </p>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4 pb-16">
          {filtered.map((entry) => (
            <RankingEntryCard
              key={entry.product.id}
              entry={entry}
              compareChecked={compareIds.has(entry.product.id)}
              compareDisabled={compareIds.size >= MAX_COMPARE}
              onCompareToggle={(checked) => toggleCompare(entry.product.id, checked)}
            />
          ))}
        </div>
      ) : (
        <p className="text-text-muted py-8 text-center text-sm">
          {search.trim()
            ? `Nenhum produto encontrado para "${search.trim()}".`
            : onlyFavorites
              ? "Você ainda não favoritou nenhum produto deste ranking."
              : "Nenhum produto desta marca no ranking atual."}
        </p>
      )}

      <CompareBar
        count={compareIds.size}
        onCompare={() => {
          setCompareOpen(true);
          pushComparison({
            slugs: compareEntries.map((e) => e.product.slug),
            comparedAt: Date.now(),
          });
        }}
        onClear={() => setCompareIds(new Set())}
      />
      <CompareTable entries={compareEntries} open={compareOpen} onOpenChange={setCompareOpen} />
    </div>
  );
}
