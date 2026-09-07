import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Calculator,
  Wallet,
  ScrollText,
  History,
  ListChecks,
  Database,
  ShieldCheck,
  HeartPulse,
  HelpCircle,
  Users,
  Target,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import {
  UpdatedBadge,
  VerifiedDataBadge,
  ConfirmedPriceBadge,
  PublicMethodologyBadge,
} from "@/modules/trust/components/TrustBadges";

export const metadata: Metadata = buildMetadata({
  title: "Central de Confiança",
  description:
    "Tudo o que a SupleScore expõe sobre como avalia, calcula, monetiza e corrige seus dados — em um só lugar.",
  path: "/confianca",
});

const pillars = [
  {
    icon: Users,
    title: "Quem Somos",
    description: "Quem está por trás da plataforma e por que ela existe.",
    href: "/sobre",
  },
  {
    icon: Target,
    title: "Nossa Missão",
    description: "O problema que o SupleScore existe para resolver.",
    href: "/missao",
  },
  {
    icon: Compass,
    title: "Nossa Metodologia",
    description: "Os seis critérios e pesos que formam o Índice.",
    href: "/metodologia",
  },
  {
    icon: Calculator,
    title: "Como Calculamos",
    description: "O passo a passo do cálculo de nota de um produto.",
    href: "/como-avaliamos",
  },
  {
    icon: Wallet,
    title: "Como Ganhamos Dinheiro",
    description: "Afiliados, o que isso compra e o que nunca compra.",
    href: "/como-ganhamos-dinheiro",
  },
  {
    icon: ScrollText,
    title: "Política Editorial",
    description: "O que decide o que entra no catálogo e como.",
    href: "/politica-editorial",
  },
  {
    icon: History,
    title: "Política de Correções",
    description: "Como um erro é corrigido sem apagar o histórico.",
    href: "/politica-de-correcoes",
  },
  {
    icon: ListChecks,
    title: "Critérios de Avaliação",
    description: "O detalhamento de cada critério do Índice.",
    href: "/como-avaliamos",
  },
  {
    icon: Database,
    title: "Fontes Utilizadas",
    description: "Rótulo, literatura científica, preço e reputação.",
    href: "/fontes",
  },
  {
    icon: ShieldCheck,
    title: "Independência Editorial",
    description: "A separação entre curadoria e monetização.",
    href: "/independencia-editorial",
  },
  {
    icon: Wallet,
    title: "Transparência Comercial",
    description: "O papel exato dos links de afiliado no produto.",
    href: "/como-ganhamos-dinheiro",
  },
  {
    icon: HeartPulse,
    title: "Aviso Médico e Científico",
    description: "O Índice não é orientação de saúde individual.",
    href: "/aviso-medico",
  },
  {
    icon: HelpCircle,
    title: "Perguntas Frequentes",
    description: "Respostas diretas às dúvidas mais comuns.",
    href: "/faq",
  },
];

export default function ConfiancaPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Central de Confiança", href: "/confianca" },
        ])}
      />
      <PageHeader
        eyebrow="Central de Confiança"
        title="Como o SupleScore ganha (e mantém) sua confiança"
        description="Toda decisão editorial, comercial e de cálculo do SupleScore está documentada publicamente — sem letras miúdas."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Central de Confiança" }]}
      />

      <Section>
        <div className="mx-auto mb-10 flex max-w-4xl flex-wrap items-center gap-2">
          <UpdatedBadge date={new Date()} />
          <VerifiedDataBadge />
          <ConfirmedPriceBadge />
          <PublicMethodologyBadge />
        </div>

        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="border-border hover:border-brand hover:bg-brand-subtle/40 flex flex-col gap-3 rounded-lg border p-5 transition-colors"
            >
              <div className="bg-brand-subtle text-brand flex size-9 items-center justify-center rounded-md">
                <pillar.icon className="size-4" aria-hidden />
              </div>
              <h2 className="text-text text-sm font-semibold">{pillar.title}</h2>
              <p className="text-text-muted text-xs">{pillar.description}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
