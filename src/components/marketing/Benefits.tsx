import { BadgeCheck, History, LineChart, Wallet } from "lucide-react";
import { Section } from "@/components/layout/Section";

const benefits = [
  {
    icon: History,
    title: "Histórico de cada avaliação",
    description:
      "Nenhuma nota é sobrescrita: acompanhe como o Índice de um produto muda ao longo do tempo.",
  },
  {
    icon: BadgeCheck,
    title: "Critérios públicos",
    description: "A fórmula por trás de cada nota é documentada — nada de caixa-preta.",
  },
  {
    icon: Wallet,
    title: "Custo-benefício real",
    description: "Preço por dose efetiva, não por embalagem — o barato pode sair caro.",
  },
  {
    icon: LineChart,
    title: "Sempre atualizado",
    description: "Preços e fórmulas mudam; nossas avaliações acompanham essas mudanças.",
  },
];

export function Benefits() {
  return (
    <Section className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-text text-3xl font-bold md:text-4xl">
          Por que usar o SupleScore
        </h2>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-6"
          >
            <div className="bg-brand-subtle text-brand flex size-10 items-center justify-center rounded-md">
              <benefit.icon className="size-5" aria-hidden />
            </div>
            <h3 className="text-text text-base font-semibold">{benefit.title}</h3>
            <p className="text-text-muted text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
