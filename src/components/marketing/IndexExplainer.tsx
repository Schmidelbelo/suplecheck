import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

/** Pesos reais da metodologia vigente (ver `/metodologia`) — nunca valores ilustrativos inventados. */
const criteria = [
  { label: "Custo-benefício", weight: 25 },
  { label: "Transparência do rótulo", weight: 25 },
  { label: "Preço por dose", weight: 15 },
  { label: "Reputação", weight: 15 },
  { label: "Promessas exageradas", weight: 10 },
  { label: "Confiabilidade da loja", weight: 10 },
];

export function IndexExplainer() {
  return (
    <Section className="border-border border-b">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <span className="text-brand text-sm font-semibold tracking-wide uppercase">
            O Índice SupleCheck
          </span>
          <h2 className="font-display text-text text-3xl font-bold md:text-4xl">
            Uma nota única, para comparar em segundos
          </h2>
          <p className="text-text-muted text-lg">
            Em vez de ler cada rótulo manualmente, você olha para um número. O Índice SupleCheck
            resume seis critérios objetivos, cada um com peso público, em uma nota de 0 a 100 —
            quanto maior, melhor o produto se posiciona na categoria.
          </p>
          <Button variant="outline" className="w-fit" asChild>
            <Link href="/metodologia">
              Ver a metodologia completa
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <Card className="mx-auto w-full max-w-md">
          <CardContent className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-sm font-medium">Exemplo ilustrativo</span>
              <span className="flex items-baseline gap-1">
                <span className="font-display text-brand text-4xl font-bold">89</span>
                <span className="text-text-subtle text-sm">/100</span>
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {criteria.map((criterion) => (
                <div key={criterion.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{criterion.label}</span>
                    <span className="text-text font-medium">peso {criterion.weight}%</span>
                  </div>
                  <div className="bg-bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${criterion.weight * 4}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
