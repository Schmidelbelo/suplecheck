"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorageSet } from "@/hooks/useLocalStorageSet";

const FAVORITES_STORAGE_KEY = "suplescore:favorites";

export function useFavorites() {
  return useLocalStorageSet(FAVORITES_STORAGE_KEY);
}

export function FavoriteButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { values, hydrated, toggle } = useFavorites();
  const isFavorite = values.has(productId);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Remover ${productName} dos favoritos`
          : `Adicionar ${productName} aos favoritos`
      }
      className={cn(
        "border-border bg-surface text-text-muted hover:text-danger flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
        isFavorite && "border-danger/30 bg-danger/10 text-danger",
        !hydrated && "opacity-0",
        className,
      )}
    >
      <Heart className="size-4" fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
