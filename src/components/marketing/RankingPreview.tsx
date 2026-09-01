import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { formatDate } from "@/lib/utils/format";
import {
  classificationBadgeVariant,
  classificationLabel,
} from "@/modules/evaluation/lib/classification";
import type { RankingView } from "@/modules/evaluation/types";

const PREVIEW_SIZE = 5;

/**
 * Prévia do ranking na Home — consome a mesma API real que `/creatina`
 * (`fetchApiOrNull`, nunca dado inventado). Mostra os primeiros
 * `PREVIEW_SIZE` produtos do ranking vigente; se ainda não houver
 * ranking gerado para a categoria, mostra um estado vazio honesto em vez
 * de um placeholder estático.
 */
export async function RankingPreview() {
  const ranking = await fetchApiOrNull<RankingView>("/api/evaluation/rankings/creatina/view");
  const entries = ranking?.entries.slice(0, PREVIEW_SIZE) ?? [];

  return (
    <Section className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="brand" className="mx-auto">
          Primeira categoria avaliada
        </Badge>
        <h2 className="font-display text-text mt-4 text-3xl font-bold md:text-4xl">
          Ranking de creatinas
        </h2>
        <p className="text-text-muted mt-4 text-lg">
          {ranking && ranking.entries.length > 0
            ? `${ranking.entries.length} produtos avaliados pelo Índice SupleCheck — nota, preço e preço por dose, tudo comparável.`
            : "O ranking de creatinas, com nota do Índice, transparência do rótulo e preço por dose, é a primeira categoria avaliada pelo SupleCheck."}
        </p>
        {ranking && ranking.entries.length > 0 ? (
          <p className="text-text-subtle mt-2 text-sm">
            Atualizado em {formatDate(ranking.generatedAt)}
          </p>
        ) : null}
      </div>

      {entries.length > 0 ? (
        <Card className="mx-auto mt-10 max-w-2xl overflow-hidden">
          <div className="divide-border flex flex-col divide-y">
            {entries.map((entry) => (
              <Link
                key={entry.product.id}
                href={`/creatina/${entry.product.slug}`}
                className="hover:bg-bg-muted flex items-center gap-4 p-4 transition-colors"
              >
                <span className="text-text-subtle w-6 shrink-0 text-center text-sm font-semibold">
                  {entry.position}
                </span>
                <img
                  src={entry.product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
                  alt={entry.product.name}
                  className="border-border bg-bg-subtle size-10 shrink-0 rounded-md border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-text truncate text-sm font-medium">{entry.product.name}</p>
                  <p className="text-text-muted text-xs">{entry.product.brand.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-text text-sm font-bold tabular-nums">
                    {entry.finalScore.toFixed(1)}
                  </span>
                  <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
                    {classificationLabel(entry.classificationTier)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          className="mx-auto mt-10 max-w-2xl"
          title="Nenhum produto avaliado ainda nesta categoria"
          description="Assim que o Índice SupleCheck calcular a primeira nota, ela aparece aqui."
        />
      )}

      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/creatina">
            Ver ranking completo
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
