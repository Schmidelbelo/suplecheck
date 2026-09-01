import Link from "next/link";
import { AlertTriangle, ArrowRight, Scale, FileSearch, Star, Store, Tag } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

/**
 * Espelha exatamente os 6 critérios embutidos do Core Domain
 * (`packages/core/src/domain/criteria/builtin/*.ts`) — id, nome, peso e
 * descrição precisam corresponder ao que o motor de cálculo realmente
 * executa. Qualquer mudança de peso/critério ali precisa ser refletida
 * aqui manualmente (não há geração automática desta lista a partir do
 * código nesta camada de marketing).
 */
const pillars = [
  {
    icon: Tag,
    weight: "25%",
    title: "Custo-benefício",
    description: "Relação entre a quantidade efetiva de princípio ativo entregue e o preço pago.",
  },
  {
    icon: FileSearch,
    weight: "25%",
    title: "Transparência do rótulo",
    description: "Mede o quanto o rótulo expõe claramente composição e dosagem, sem omissões.",
  },
  {
    icon: Scale,
    weight: "15%",
    title: "Preço por dose",
    description: "Compara o custo por dose do produto com a média de mercado da categoria.",
  },
  {
    icon: Star,
    weight: "15%",
    title: "Reputação",
    description:
      "Avaliação média de compradores, amortecida pela quantidade de avaliações disponíveis.",
  },
  {
    icon: AlertTriangle,
    weight: "10%",
    title: "Promessas exageradas",
    description: "Proporção de alegações de marketing sem respaldo científico identificável.",
  },
  {
    icon: Store,
    weight: "10%",
    title: "Confiabilidade da loja",
    description: "Reputação e garantias oferecidas pela loja que vende o produto avaliado.",
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
          Seis critérios, um processo transparente
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
