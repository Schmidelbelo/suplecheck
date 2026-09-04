import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Termos de Uso",
  description: "Condições de uso da plataforma SupleScore.",
  path: "/termos",
});

const sections: LegalSection[] = [
  {
    title: "1. Aceitação dos termos",
    body: (
      <p>
        Ao acessar o SupleScore, você concorda com estes Termos de Uso. Se não concordar com alguma
        condição, recomendamos não utilizar a plataforma.
      </p>
    ),
  },
  {
    title: "2. Natureza do serviço",
    body: (
      <p>
        O SupleScore é uma plataforma de comparação e conteúdo informativo. Não somos uma farmácia,
        loja ou distribuidor de suplementos, e não realizamos a venda direta de nenhum produto
        exibido. As avaliações refletem análise de composição, rótulo e preço público — não
        substituem orientação médica, nutricional ou de um profissional de educação física.
      </p>
    ),
  },
  {
    title: "3. Uso permitido",
    body: (
      <ul className="flex flex-col gap-2">
        <li>Utilizar o conteúdo para decisão de compra pessoal;</li>
        <li>Compartilhar links e trechos do conteúdo, com atribuição ao SupleScore;</li>
        <li>
          Não é permitido copiar, reproduzir ou redistribuir integralmente o conteúdo do site sem
          autorização prévia.
        </li>
      </ul>
    ),
  },
  {
    title: "4. Links de afiliados",
    body: (
      <p>
        Alguns links para lojas parceiras podem gerar comissão ao SupleScore sem custo adicional
        para você. Detalhes completos em{" "}
        <a href="/como-ganhamos-dinheiro">Como Ganhamos Dinheiro</a>.
      </p>
    ),
  },
  {
    title: "5. Isenção de responsabilidade",
    body: (
      <p>
        As informações são fornecidas &ldquo;como estão&rdquo;, com base nos dados disponíveis no
        momento da avaliação. Fórmulas de produtos podem mudar sem aviso do fabricante; sempre
        confira o rótulo físico antes de consumir qualquer produto.
      </p>
    ),
  },
  {
    title: "6. Alterações destes termos",
    body: (
      <p>
        Podemos atualizar estes termos periodicamente. O uso continuado da plataforma após uma
        atualização implica concordância com os novos termos.
      </p>
    ),
  },
];

export default function TermosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Termos de Uso"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Termos de Uso" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="26 de agosto de 2026" />
      </Section>
    </>
  );
}
