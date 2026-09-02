import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Link2, ShieldCheck, Sparkles } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = buildMetadata({
  title: "Como Ganhamos Dinheiro",
  description:
    "Transparência sobre o modelo de negócio do SupleCheck: links de afiliados, o que isso significa e o que nunca influencia o ranking.",
  path: "/como-ganhamos-dinheiro",
});

const points = [
  {
    icon: Link2,
    title: "Links de afiliados",
    description:
      "Quando você clica para comprar um produto avaliado, esse link pode ser de afiliado — a loja paga uma pequena comissão ao SupleCheck sem custo adicional para você.",
  },
  {
    icon: Ban,
    title: "O que isso NÃO compra",
    description:
      "Uma marca não pode pagar para ter uma nota melhor, aparecer em posição mais alta ou ser incluída no ranking antes de ser avaliada pelos mesmos critérios que qualquer concorrente.",
  },
  {
    icon: ShieldCheck,
    title: "Separação entre nota e monetização",
    description:
      "O cálculo do Índice acontece antes e independentemente de qualquer parceria comercial. A equipe de curadoria não tem visibilidade sobre quais links geram receita.",
  },
  {
    icon: Sparkles,
    title: "Plano premium (futuro)",
    description:
      "Estamos construindo um plano pago opcional com recursos extras para o usuário (histórico de preço, alertas) — não recursos que alterem a avaliação de produtos.",
  },
];

export default function ComoGanhamosDinheiroPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Como Ganhamos Dinheiro", href: "/como-ganhamos-dinheiro" },
        ])}
      />
      <PageHeader
        eyebrow="Transparência"
        title="Como o SupleCheck se sustenta financeiramente"
        description="Se um site de comparação depende de quem ele compara para sobreviver, o leitor merece saber exatamente como."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Como Ganhamos Dinheiro" }]}
      />

      <Section>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {points.map((point) => (
            <div
              key={point.title}
              className="border-border flex flex-col gap-3 rounded-lg border p-6"
            >
              <div className="bg-brand-subtle text-brand flex size-10 items-center justify-center rounded-md">
                <point.icon className="size-5" aria-hidden />
              </div>
              <h2 className="text-text text-base font-semibold">{point.title}</h2>
              <p className="text-text-muted text-sm">{point.description}</p>
            </div>
          ))}
        </div>

        <div className="border-border text-text-muted mx-auto mt-10 max-w-4xl rounded-lg border border-dashed p-6 text-sm">
          Dúvidas sobre uma parceria comercial ou sobre como um link específico funciona? Fale com a
          gente pela página de{" "}
          <Link href="/contato" className="text-brand font-medium hover:underline">
            Contato
          </Link>
          .
        </div>
      </Section>
    </>
  );
}
