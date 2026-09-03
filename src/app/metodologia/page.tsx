import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = buildMetadata({
  title: "Metodologia",
  description:
    "O cálculo completo do Índice SupleCheck: fórmula, pesos, versionamento e como o histórico de cada nota é preservado.",
  path: "/metodologia",
});

export default function MetodologiaPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Metodologia", href: "/metodologia" },
        ])}
      />
      <PageHeader
        eyebrow="Metodologia"
        title="A fórmula por trás do Índice SupleCheck"
        description="Documentação completa e pública do cálculo — a mesma fórmula é aplicada a todo produto, de toda marca."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Metodologia" }]}
      />

      <Section className="border-border border-b">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="font-display text-text text-2xl font-bold">A fórmula</h2>
          <p className="text-text-muted">
            O Índice SupleCheck é uma média ponderada de seis subnotas, cada uma calculada em uma
            escala de 0 a 100 e depois combinada pelos pesos definidos em{" "}
            <Link href="/como-avaliamos" className="text-brand font-medium hover:underline">
              Como Avaliamos
            </Link>
            :
          </p>

          <Card>
            <CardContent className="p-6">
              <code className="text-text block font-mono text-sm whitespace-pre-wrap">
                {`Índice = (Custo-benefício × 0.25)
        + (Transparência do rótulo × 0.25)
        + (Preço por dose × 0.15)
        + (Reputação × 0.15)
        + (Promessas exageradas × 0.10)
        + (Confiabilidade da loja × 0.10)`}
              </code>
            </CardContent>
          </Card>

          <p className="text-text-muted">
            Cada subnota é calculada individualmente antes de entrar na fórmula. A subnota de
            Custo-benefício, por exemplo, compara a quantidade declarada de princípio ativo por
            porção com a faixa de referência da categoria: dosagens dentro da faixa eficaz pontuam
            mais alto, abaixo dela perdem pontos proporcionalmente — combinado com o preço pago por
            essa quantidade.
          </p>
        </div>
      </Section>

      <Section className="border-border bg-bg-subtle border-b">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="font-display text-text text-2xl font-bold">Versionamento do Índice</h2>
          <p className="text-text-muted">
            Toda vez que a composição, o preço ou a fórmula de cálculo de um produto muda, uma nova
            nota é calculada — a anterior não é sobrescrita, apenas substituída como valor atual.
            Isso permite reconstruir o histórico de um produto ao longo do tempo, em vez de mostrar
            apenas um número estático.
          </p>
          <p className="text-text-muted">
            Se a metodologia em si mudar (por exemplo, um ajuste de peso entre critérios), a mudança
            é registrada com data e justificativa nesta página.
          </p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="font-display text-text text-2xl font-bold">Contestações</h2>
          <p className="text-text-muted">
            Se uma marca ou um leitor identificar um erro factual em um dado usado no cálculo (por
            exemplo, um rótulo desatualizado), o caso pode ser reportado pela página de{" "}
            <Link href="/contato" className="text-brand font-medium hover:underline">
              Contato
            </Link>
            . Correções de dado não alteram os pesos ou a fórmula — apenas o valor de entrada
            incorreto.
          </p>
        </div>
      </Section>
    </>
  );
}
