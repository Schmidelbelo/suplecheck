import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/layout/Section";

export default function NotFound() {
  return (
    <Section className="flex flex-col items-center gap-4 text-center">
      <p className="text-brand text-sm font-medium">404</p>
      <h1 className="text-text text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-text-muted max-w-md">
        O conteúdo que você procura não existe ou foi movido.
      </p>
      <Button asChild>
        <Link href="/">Voltar para o início</Link>
      </Button>
    </Section>
  );
}
