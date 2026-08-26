import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/layout/Section";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Página não encontrada",
  path: "/404",
  noIndex: true,
});

const suggestions = [
  { label: "Home", href: "/" },
  { label: "Ranking", href: "/ranking" },
  { label: "Como Avaliamos", href: "/como-avaliamos" },
  { label: "Contato", href: "/contato" },
];

export default function NotFound() {
  return (
    <Section className="flex flex-col items-center gap-6 text-center">
      <div className="bg-bg-muted text-text-subtle flex size-14 items-center justify-center rounded-full">
        <SearchX className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-brand text-sm font-semibold">Erro 404</p>
        <h1 className="font-display text-text text-3xl font-bold md:text-4xl">
          Página não encontrada
        </h1>
        <p className="text-text-muted max-w-md">
          O conteúdo que você procura não existe ou foi movido de lugar. Confira os links abaixo ou
          volte para o início.
        </p>
      </div>

      <Button asChild>
        <Link href="/">
          Voltar para o início
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>

      <nav aria-label="Sugestões de navegação" className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-border text-text-muted hover:border-brand hover:text-brand rounded-full border px-4 py-1.5 text-sm transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </Section>
  );
}
