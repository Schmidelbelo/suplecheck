import { CheckCircle2, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { buildProductSummary } from "../lib/productInsights";
import type { IndexResultDTO } from "../types";

/**
 * Bloco "Em resumo" — Server Component puro, sem `"use client"`: todo o
 * texto vem de `buildProductSummary` (determinístico sobre o
 * `breakdown` já calculado), zero JavaScript adicional no cliente.
 */
export function ProductSummary({ score }: { score: IndexResultDTO }) {
  const summary = buildProductSummary(score);

  return (
    <Card className="bg-bg-subtle">
      <CardContent className="flex flex-col gap-5 p-6">
        <div>
          <p className="text-brand text-xs font-semibold tracking-wide uppercase">Em resumo</p>
          <p className="text-text mt-1 text-sm font-medium">{summary.audience}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {summary.pros.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-text flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <ThumbsUp className="text-success size-3.5" aria-hidden />
                Vantagens
              </p>
              <ul className="flex flex-col gap-1.5">
                {summary.pros.map((pro) => (
                  <li key={pro} className="text-text-muted flex items-start gap-1.5 text-sm">
                    <CheckCircle2 className="text-success mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.cons.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-text flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <ThumbsDown className="text-danger size-3.5" aria-hidden />
                Pontos de atenção
              </p>
              <ul className="flex flex-col gap-1.5">
                {summary.cons.map((con) => (
                  <li key={con} className="text-text-muted flex items-start gap-1.5 text-sm">
                    <XCircle className="text-danger mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="border-border flex flex-col gap-2 border-t pt-4 text-sm">
          <p className="text-text">
            <span className="font-semibold">Vale a compra:</span> {summary.buyIf}
          </p>
          {summary.skipIf ? (
            <p className="text-text-muted">
              <span className="text-text font-semibold">Considere alternativas:</span>{" "}
              {summary.skipIf}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
