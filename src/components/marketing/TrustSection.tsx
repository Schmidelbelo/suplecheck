import Link from "next/link";
import { ShieldCheck, Compass, ListChecks, Calculator, Scale, Wallet } from "lucide-react";
import { Section } from "@/components/layout/Section";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Por que confiar na SupleScore",
    description: "Nenhuma marca paga para ter nota melhor — o Índice é o mesmo para todos.",
    href: "/confianca",
  },
  {
    icon: Compass,
    title: "Como funciona nossa metodologia",
    description: "Seis critérios públicos, com peso definido, formam a nota de cada produto.",
    href: "/metodologia",
  },
  {
    icon: ListChecks,
    title: "Como escolhemos os produtos",
    description: "O que entra no catálogo segue uma política editorial documentada.",
    href: "/politica-editorial",
  },
  {
    icon: Calculator,
    title: "Como calculamos as notas",
    description: "Do rótulo ao preço monitorado até o número final — passo a passo.",
    href: "/como-avaliamos",
  },
  {
    icon: Scale,
    title: "Independência editorial",
    description: "Quem avalia um produto nunca é quem negocia com a marca dele.",
    href: "/independencia-editorial",
  },
  {
    icon: Wallet,
    title: "Transparência financeira",
    description: "Como ganhamos dinheiro e por que isso nunca influencia uma nota.",
    href: "/como-ganhamos-dinheiro",
  },
];

export function TrustSection() {
  return (
    <Section className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-text text-3xl font-bold md:text-4xl">
          Uma nota em que dá para confiar
        </h2>
        <p className="text-text-muted mt-3 text-sm">
          Cada peça de como o SupleScore funciona está documentada publicamente — veja a{" "}
          <Link href="/confianca" className="text-brand font-medium hover:underline">
            Central de Confiança
          </Link>
          .
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trustPoints.map((point) => (
          <Link
            key={point.title}
            href={point.href}
            className="border-border bg-surface hover:border-brand flex flex-col gap-3 rounded-lg border p-6 transition-colors"
          >
            <div className="bg-brand-subtle text-brand flex size-10 items-center justify-center rounded-md">
              <point.icon className="size-5" aria-hidden />
            </div>
            <h3 className="text-text text-base font-semibold">{point.title}</h3>
            <p className="text-text-muted text-sm">{point.description}</p>
          </Link>
        ))}
      </div>
    </Section>
  );
}
