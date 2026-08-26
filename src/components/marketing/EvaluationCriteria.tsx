import Link from "next/link";
import { ArrowRight, Beaker, FileSearch, Scale, Tag } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

const pillars = [
  {
    icon: Beaker,
    weight: "35%",
    title: "Pureza da composição",
    description:
      "Verificamos aditivos, cargas e a presença de substâncias não declaradas no rótulo.",
  },
  {
    icon: Scale,
    weight: "30%",
    title: "Dosagem por porção",
    description:
      "Comparamos a quantidade real do princípio ativo com as referências da literatura científica.",
  },
  {
    icon: FileSearch,
    weight: "20%",
    title: "Transparência do rótulo",
    description:
      "Penalizamos misturas proprietárias e informações nutricionais incompletas ou ambíguas.",
  },
  {
    icon: Tag,
    weight: "15%",
    title: "Custo-benefício",
    description: "Calculamos o preço por dose efetiva, não pelo preço do pote.",
  },
];

export function EvaluationCriteria() {
  return (
    <Section className="border-border border-b">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-brand text-sm font-semibold tracking-wide uppercase">
          Como avaliamos
        </span>
        <h2 className="font-display text-text mt-3 text-3xl font-bold md:text-4xl">
          Quatro critérios, um processo transparente
        </h2>
        <p className="text-text-muted mt-4 text-lg">
          Cada critério tem peso definido e documentado publicamente — nenhuma nota é atribuída
          manualmente ou por opinião.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="border-border flex gap-4 rounded-lg border p-6">
            <div className="bg-bg-muted text-text flex size-11 shrink-0 items-center justify-center rounded-md">
              <pillar.icon className="size-5" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-text text-base font-semibold">{pillar.title}</h3>
                <span className="text-text-subtle text-xs font-medium">peso {pillar.weight}</span>
              </div>
              <p className="text-text-muted text-sm">{pillar.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/como-avaliamos">
            Ver o processo completo
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
