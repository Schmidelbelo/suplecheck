import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

const placeholderRows = [1, 2, 3, 4, 5];

/**
 * Prévia do ranking na Home. Nenhum produto real é exibido nesta etapa —
 * apenas a estrutura visual (linhas em skeleton) que será populada quando
 * o ranking de creatinas (Fase 0) entrar em produção.
 */
export function RankingPreview() {
  return (
    <Section className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mx-auto">
          <Lock className="size-3.5" aria-hidden />
          Em preparação
        </Badge>
        <h2 className="font-display text-text mt-4 text-3xl font-bold md:text-4xl">
          Ranking de creatinas
        </h2>
        <p className="text-text-muted mt-4 text-lg">
          A primeira categoria avaliada pelo SupleCheck. O ranking completo, com nota do Índice,
          composição e preço por dose, chega em breve.
        </p>
      </div>

      <Card className="mx-auto mt-10 max-w-2xl overflow-hidden">
        <CardContent className="divide-border flex flex-col divide-y p-0">
          {placeholderRows.map((row) => (
            <div key={row} className="flex items-center gap-4 p-4">
              <span className="text-text-subtle w-6 shrink-0 text-center text-sm font-semibold">
                {row}
              </span>
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-12 shrink-0 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/ranking">
            Ser avisado no lançamento
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
