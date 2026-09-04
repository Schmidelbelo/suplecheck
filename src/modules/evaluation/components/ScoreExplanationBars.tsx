import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { OverallScoreResult } from "@core/index";

interface BarItem {
  readonly label: string;
  readonly value: number | null;
}

/**
 * "Como chegamos nessa recomendação" — barras visuais dos componentes
 * já calculados por `calculateOverallScores` (Core Domain). Nenhum
 * número aqui é recalculado; é só a apresentação de
 * `scoreComponents`/`overallScore` que a API já entrega prontos.
 */
export function ScoreExplanationBars({
  components,
  overallScore,
}: {
  components: OverallScoreResult["components"];
  overallScore: number;
}) {
  const bars: BarItem[] = [
    { label: "Nota (Índice SupleScore)", value: components.quality },
    { label: "Preço", value: components.price },
    { label: "Preço por dose", value: components.pricePerDose },
    { label: "Preço por grama", value: components.pricePerGram },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-text text-sm font-semibold">Como chegamos nessa recomendação</p>
          <span className="text-brand text-lg font-bold tabular-nums">
            {overallScore.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{bar.label}</span>
                <span className="text-text-muted tabular-nums">
                  {bar.value != null ? bar.value.toFixed(0) : "Sem dado"}
                </span>
              </div>
              <div
                className="bg-bg-muted h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={bar.value != null ? Math.round(bar.value) : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={bar.label}
              >
                <div
                  className={cn(
                    "bg-brand h-full rounded-full transition-all",
                    bar.value == null && "opacity-30",
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, bar.value ?? 0))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-text-subtle text-xs">
          Score Geral = combinação ponderada destes componentes. Ver{" "}
          <Link href="/metodologia" className="underline">
            metodologia
          </Link>{" "}
          para os pesos usados.
        </p>
      </CardContent>
    </Card>
  );
}
