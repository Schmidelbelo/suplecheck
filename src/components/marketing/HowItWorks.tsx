import { ClipboardList, FlaskConical, Trophy, Search } from "lucide-react";
import { Section } from "@/components/layout/Section";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Coletamos os dados",
    description:
      "Reunimos rótulo, tabela nutricional, certificações e preço de cada produto avaliado.",
  },
  {
    number: "02",
    icon: FlaskConical,
    title: "Analisamos a composição",
    description:
      "Comparamos dosagem real por porção com a literatura científica e sinalizamos misturas proprietárias e aditivos.",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Calculamos o Índice",
    description:
      "Pureza, dosagem, transparência e custo-benefício viram uma nota única de 0 a 100 — o Índice SupleCheck.",
  },
  {
    number: "04",
    icon: Trophy,
    title: "Publicamos o ranking",
    description:
      "O resultado fica público, comparável e é atualizado sempre que preço ou fórmula mudam.",
  },
];

export function HowItWorks() {
  return (
    <Section id="como-funciona" className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-text text-3xl font-bold md:text-4xl">Como funciona</h2>
        <p className="text-text-muted mt-4 text-lg">
          Do rótulo à nota final, um processo repetível e auditável.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-brand text-brand-foreground flex size-10 items-center justify-center rounded-full">
                <step.icon className="size-5" aria-hidden />
              </div>
              <span className="font-display text-text-subtle text-sm font-semibold">
                {step.number}
              </span>
            </div>
            <h3 className="text-text text-base font-semibold">{step.title}</h3>
            <p className="text-text-muted text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
