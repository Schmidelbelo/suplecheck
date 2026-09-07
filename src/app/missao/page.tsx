import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = buildMetadata({
  title: "Nossa Missão",
  description:
    "Por que o SupleScore existe: transformar rótulo de suplemento em decisão de compra clara, sem depender de quem está sendo comparado.",
  path: "/missao",
});

export default function MissaoPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Nossa Missão", href: "/missao" },
        ])}
      />
      <PageHeader
        eyebrow="Missão"
        title="Transformar rótulo em decisão"
        description="Comparar suplementos deveria ser tão simples quanto ler um número — não decifrar uma tabela nutricional sozinho."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Nossa Missão" }]}
      />

      <Section>
        <div className="text-text-muted mx-auto flex max-w-3xl flex-col gap-4">
          <p>
            A maioria das pessoas que compra um suplemento não tem tempo nem formação técnica para
            comparar composição, dosagem eficaz, transparência de rótulo e preço por dose entre
            dezenas de produtos parecidos. O resultado é decidir por marca conhecida, embalagem
            chamativa ou o primeiro resultado de busca — não pelo que realmente entrega mais valor
            pelo preço pago.
          </p>
          <p>
            O SupleScore existe para resolver exatamente essa lacuna: pegar os mesmos dados que
            qualquer pessoa poderia levantar sozinha (rótulo, literatura científica, preço de
            mercado) e resumi-los em uma nota única, calculada sempre da mesma forma, para qualquer
            marca — sem exceção e sem posição paga.
          </p>
          <p>
            Isso só funciona se a metodologia for pública e auditável. Por isso cada critério, peso
            e fonte de dado está documentado nas páginas de{" "}
            <Link href="/metodologia" className="text-brand font-medium hover:underline">
              Metodologia
            </Link>{" "}
            e{" "}
            <Link href="/como-avaliamos" className="text-brand font-medium hover:underline">
              Como Avaliamos
            </Link>
            , não escondido atrás de uma nota que você precisa simplesmente confiar.
          </p>
          <p>
            Quem somos e como operamos como equipe está na página{" "}
            <Link href="/sobre" className="text-brand font-medium hover:underline">
              Sobre
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
