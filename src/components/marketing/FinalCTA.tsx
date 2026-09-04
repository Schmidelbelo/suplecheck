import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <Section className="bg-neutral-950 text-neutral-50">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Pare de decidir no achismo</h2>
        <p className="text-lg text-neutral-300">
          O Índice SupleScore existe para transformar rótulo em decisão. Comece pelo ranking de
          creatinas, a primeira categoria avaliada.
        </p>
        <Button size="lg" variant="primary" asChild>
          <Link href="/ranking">
            Explorar o ranking
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
