"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { criterionLabel } from "@/modules/evaluation/lib/criteria";
import { useRecommendationHistory } from "../lib/recommendationHistory";
import { PRIORITY_LABELS, type RecommendationProfileForm } from "../lib/profileQuery";
import type { RecommendationApiResponse } from "../types";
import type { RecommendationEntry } from "@core/index";

function EntryMiniCard({ entry, label }: { entry: RecommendationEntry; label: string }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="text-brand text-xs font-semibold tracking-wide uppercase">{label}</p>
      <Link href={`/creatina/${entry.productSlug}`} className="flex flex-col gap-3">
        <ProductMiniCard
          imageUrl={null}
          name={entry.productName}
          brandName={entry.brandName}
          priceCents={entry.priceCents}
          classificationTier={entry.classificationTier}
          score={entry.personalizedScore}
        />
      </Link>
    </Card>
  );
}

export function RecommendationResultView({
  profile,
  recommendation,
}: {
  profile: RecommendationProfileForm;
  recommendation: RecommendationApiResponse | null;
}) {
  const router = useRouter();
  const history = useRecommendationHistory();
  const queryString = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.search.replace(/^\?/, "");
  }, []);

  React.useEffect(() => {
    if (!recommendation?.recommended || !history.hydrated) return;
    history.push({
      query: queryString,
      recommendedProductName: recommendation.recommended.productName,
      generatedAt: Date.now(),
    });
    // Só na primeira renderização com um resultado válido — não deve re-inserir a cada re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendation?.recommended?.productId, history.hydrated]);

  if (!recommendation || !recommendation.recommended) {
    return (
      <EmptyState
        title="Ainda não há produtos avaliados para este perfil"
        description="Tente ajustar o orçamento ou o objetivo — o Assistente só recomenda produtos com avaliação real no catálogo."
        action={
          <Button onClick={() => router.push("/assistente")}>
            <RotateCcw className="size-4" aria-hidden />
            Refazer
          </Button>
        }
      />
    );
  }

  const { recommended, runnerUp, cheapest, comparisonNarrative, weightsUsed } = recommendation;
  const comparisonEntries = [recommended, runnerUp, cheapest].filter(
    (e, index, all): e is RecommendationEntry =>
      e !== null && all.findIndex((other) => other?.productId === e.productId) === index,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-text-muted text-sm">
          Prioridade:{" "}
          <span className="text-text font-medium">{PRIORITY_LABELS[profile.priority]}</span>
          {profile.budgetCents != null ? (
            <>
              {" "}
              · Orçamento:{" "}
              <span className="text-text font-medium">
                {formatCurrencyBRL(profile.budgetCents)}
              </span>
            </>
          ) : null}
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/assistente")}>
          <RotateCcw className="size-4" aria-hidden />
          Refazer
        </Button>
      </div>

      <Card className="border-brand overflow-hidden border-2">
        <CardContent className="flex flex-col gap-5 p-6">
          <p className="text-brand flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Recomendado para você
          </p>
          <div>
            <Link
              href={`/creatina/${recommended.productSlug}`}
              className="text-text text-2xl font-bold hover:underline"
            >
              {recommended.productName}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-text-muted text-xs uppercase">Preço</p>
              <p className="text-text text-lg font-semibold tabular-nums">
                {recommended.priceCents != null ? formatCurrencyBRL(recommended.priceCents) : "—"}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Score Geral</p>
              <p className="text-text text-lg font-semibold tabular-nums">
                {recommended.overallScore.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase">Score Personalizado</p>
              <p className="text-brand text-lg font-semibold tabular-nums">
                {recommended.personalizedScore.toFixed(1)}
              </p>
            </div>
          </div>

          <p className="text-text-muted text-sm">
            Recomendamos este produto porque, considerando a prioridade escolhida (
            {PRIORITY_LABELS[profile.priority]}), ele obteve a maior pontuação personalizada entre
            os produtos avaliados
            {profile.budgetCents != null ? " dentro do orçamento informado" : ""}.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.topAdvantages.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-text flex items-center gap-1.5 text-sm font-semibold">
                  <ThumbsUp className="text-success size-4" aria-hidden />
                  Principais vantagens
                </p>
                <ul className="flex flex-col gap-1">
                  {recommended.topAdvantages.map((c) => (
                    <li key={c.criterionId} className="text-text-muted text-sm">
                      {criterionLabel(c.criterionId)} — {c.score.toFixed(0)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {recommended.topDisadvantages.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-text flex items-center gap-1.5 text-sm font-semibold">
                  <ThumbsDown className="text-danger size-4" aria-hidden />
                  Pontos de atenção
                </p>
                <ul className="flex flex-col gap-1">
                  {recommended.topDisadvantages.map((c) => (
                    <li key={c.criterionId} className="text-text-muted text-sm">
                      {criterionLabel(c.criterionId)} — {c.score.toFixed(0)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {comparisonEntries.length > 1 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-text text-xl font-bold">Comparação automática</h2>
          {comparisonNarrative.length > 0 ? (
            <div className="bg-brand-subtle flex flex-col gap-1.5 rounded-lg p-3 text-sm">
              {comparisonNarrative.map((sentence) => (
                <p key={sentence} className="text-text">
                  {sentence}
                </p>
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            {comparisonEntries.map((entry) => (
              <EntryMiniCard
                key={entry.productId}
                entry={entry}
                label={
                  entry.productId === recommended.productId
                    ? "Recomendado"
                    : entry.productId === runnerUp?.productId
                      ? "Segundo melhor"
                      : "Mais barato"
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      <details className="text-text-muted text-xs">
        <summary className="cursor-pointer">Pesos usados nesta recomendação</summary>
        <ul className="mt-2 flex flex-col gap-1">
          <li>Nota (Índice SupleScore): {(weightsUsed.quality * 100).toFixed(0)}%</li>
          <li>Preço: {(weightsUsed.price * 100).toFixed(0)}%</li>
          <li>Preço por dose: {(weightsUsed.pricePerDose * 100).toFixed(0)}%</li>
          <li>Preço por grama: {(weightsUsed.pricePerGram * 100).toFixed(0)}%</li>
          <li>Transparência do rótulo: {(weightsUsed.transparency * 100).toFixed(0)}%</li>
        </ul>
      </details>

      {history.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-text text-lg font-semibold">Suas últimas recomendações</h2>
          <ul className="flex flex-col gap-1">
            {history.items.map((item) => (
              <li key={item.query}>
                <Link
                  href={`/assistente?${item.query}`}
                  className="text-brand text-sm hover:underline"
                >
                  {item.recommendedProductName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
