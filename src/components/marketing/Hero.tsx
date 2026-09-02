import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function Hero() {
  return (
    <div className="border-border bg-bg relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,color-mix(in_srgb,var(--color-brand)_12%,transparent),transparent_60%)]"
      />
      <Container className="animate-slide-up flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <Badge variant="brand">
          <Sparkles className="size-3.5" aria-hidden />
          Comparação independente de suplementos
        </Badge>

        <h1 className="font-display text-text max-w-3xl text-4xl leading-tight font-bold md:text-6xl">
          Escolha suplementos com <span className="text-brand">dados</span>, não com marketing
        </h1>

        <p className="text-text-muted max-w-2xl text-lg md:text-xl">
          O SupleCheck avalia custo-benefício, transparência do rótulo, reputação e mais critérios
          objetivos de cada produto e resume tudo em uma nota única: o Índice SupleCheck. Sem
          publicidade paga influenciando o resultado.
        </p>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/ranking">
              Ver o ranking
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/como-avaliamos">Como avaliamos</Link>
          </Button>
        </div>

        <div className="text-text-subtle mt-6 flex items-center gap-2 text-sm">
          <ShieldCheck className="text-brand size-4" aria-hidden />
          Metodologia pública · Sem venda de posição no ranking
        </div>
      </Container>
    </div>
  );
}
