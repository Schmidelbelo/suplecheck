import Link from "next/link";
import { PiggyBank, Star, Scale } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import type { RankingViewEntry } from "../types";

const SLOT_META = {
  cheapest: {
    icon: PiggyBank,
    title: "Se eu fosse economizar…",
  },
  topRated: {
    icon: Star,
    title: "Se eu quisesse a maior nota…",
  },
  bestBalance: {
    icon: Scale,
    title: "Melhor equilíbrio entre nota e preço",
  },
} as const;

export function AlternativeRecommendationCard({
  slot,
  entry,
}: {
  slot: keyof typeof SLOT_META;
  entry: RankingViewEntry;
}) {
  const { icon: Icon, title } = SLOT_META[slot];
  const { product } = entry;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="text-brand flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Icon className="size-3.5" aria-hidden />
        {title}
      </p>
      <Link href={`/creatina/${product.slug}`} className="flex flex-col gap-3">
        <ProductMiniCard
          imageUrl={product.imageUrl}
          name={product.name}
          brandName={product.brand.name}
          priceCents={product.price?.cents ?? null}
          classificationTier={entry.classificationTier}
          score={entry.finalScore}
        />
      </Link>
    </Card>
  );
}
