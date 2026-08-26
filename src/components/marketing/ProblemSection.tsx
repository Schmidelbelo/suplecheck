import { AlertTriangle, EyeOff, TrendingDown } from "lucide-react";
import { Section } from "@/components/layout/Section";

const problems = [
  {
    icon: EyeOff,
    title: "Rótulos difíceis de interpretar",
    description:
      "Dosagens em formatos diferentes, misturas proprietárias e termos técnicos tornam quase impossível comparar dois produtos de forma justa.",
  },
  {
    icon: AlertTriangle,
    title: "Marketing pesa mais que composição",
    description:
      "Embalagem, influenciador e preço de tabela costumam dizer mais sobre o orçamento de marketing da marca do que sobre a qualidade do produto.",
  },
  {
    icon: TrendingDown,
    title: "Custo-benefício invisível",
    description:
      "O produto mais caro nem sempre é o melhor, e o mais barato nem sempre é o pior — mas sem comparar dosagem real por porção, essa conta é impossível de fazer.",
  },
];

export function ProblemSection() {
  return (
    <Section className="border-border border-b">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-text text-3xl font-bold md:text-4xl">
          Escolher um suplemento não deveria ser um chute
        </h2>
        <p className="text-text-muted mt-4 text-lg">
          O mercado de suplementos cresce mais rápido do que a informação confiável disponível para
          quem compra.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {problems.map((problem) => (
          <div
            key={problem.title}
            className="border-border flex flex-col gap-3 rounded-lg border p-6"
          >
            <div className="bg-danger/10 text-danger flex size-10 items-center justify-center rounded-md">
              <problem.icon className="size-5" aria-hidden />
            </div>
            <h3 className="text-text text-base font-semibold">{problem.title}</h3>
            <p className="text-text-muted text-sm">{problem.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
