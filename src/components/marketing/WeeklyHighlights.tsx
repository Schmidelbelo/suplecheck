import Link from "next/link";
import { Trophy, Star, Wallet } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import type { RankingView, RankingViewEntry } from "@/modules/evaluation/types";

const HIGHLIGHT_BADGES = [
  { label: "Melhor Compra", icon: Trophy, eyebrow: "Melhor Compra" },
  { label: "Melhor Avaliado", icon: Star, eyebrow: "Melhor Avaliado" },
  { label: "Melhor Preço", icon: Wallet, eyebrow: "Melhor Preço" },
] as const;

/**
 * "Destaques da semana" — nunca uma curadoria manual: são os mesmos 3
 * selos (Core Domain, `assignProductBadges`) já calculados para o
 * ranking de creatina, apenas destacados na home. Se o líder de algum
 * selo mudar (reavaliação, nova captura de preço), a home reflete
 * sozinha — nenhum texto fixo para atualizar manualmente.
 */
export async function WeeklyHighlights() {
  const ranking = await fetchApiOrNull<RankingView>("/api/evaluation/rankings/creatina/view");
  if (!ranking) return null;

  const highlights = HIGHLIGHT_BADGES.map((meta) => {
    const entry = ranking.entries.find((e) => e.badges.some((b) => b.label === meta.label));
    return entry ? { meta, entry } : null;
  }).filter(
    (h): h is { meta: (typeof HIGHLIGHT_BADGES)[number]; entry: RankingViewEntry } => h !== null,
  );

  if (highlights.length === 0) return null;

  return (
    <Section className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-text text-3xl font-bold md:text-4xl">
          Destaques da semana
        </h2>
        <p className="text-text-muted mt-4 text-lg">
          Calculado automaticamente a partir do ranking real de creatina — atualiza sozinho.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {highlights.map(({ meta, entry }) => (
          <Link key={meta.label} href={`/creatina/${entry.product.slug}`}>
            <Card className="hover:border-border-strong flex h-full flex-col gap-3 p-5 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
              <p className="text-brand flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <meta.icon className="size-3.5" aria-hidden />
                {meta.eyebrow}
              </p>
              <ProductMiniCard
                imageUrl={entry.product.imageUrl}
                name={entry.product.name}
                brandName={entry.product.brand.name}
                priceCents={entry.product.price?.cents ?? null}
                classificationTier={entry.classificationTier}
                score={entry.finalScore}
              />
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}
