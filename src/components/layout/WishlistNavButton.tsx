"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFavorites } from "@/modules/evaluation/components/FavoriteButton";

/** Ícone de lista de desejos com contador — só aparece com contagem > 0 após hidratar, evita "0" piscando no primeiro render. */
export function WishlistNavButton() {
  const { values, hydrated } = useFavorites();
  const count = values.size;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      asChild
      aria-label="Minha lista de desejos"
    >
      <Link href="/favoritos">
        <Heart className="size-5" aria-hidden />
        {hydrated && count > 0 ? (
          <span className="bg-brand text-brand-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold tabular-nums">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
