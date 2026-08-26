import { Sparkles } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { LeadCaptureForm } from "@/modules/leads/components/LeadCaptureForm";

export interface ComingSoonProps {
  eyebrow?: string;
  title: string;
  description: string;
  leadSource: string;
}

/**
 * Padrão reutilizável para seções/páginas ainda não implementadas
 * (ex: /ranking antes do catálogo real existir) — comunica o que vem a
 * seguir e captura e-mail em vez de mostrar uma página vazia ou 404.
 */
export function ComingSoon({
  eyebrow = "Em breve",
  title,
  description,
  leadSource,
}: ComingSoonProps) {
  return (
    <Section className="flex flex-col items-center gap-6 text-center">
      <Badge variant="brand">
        <Sparkles className="size-3.5" aria-hidden />
        {eyebrow}
      </Badge>
      <h1 className="font-display text-text text-3xl font-bold md:text-4xl">{title}</h1>
      <p className="text-text-muted max-w-xl text-lg">{description}</p>
      <div className="w-full max-w-md">
        <LeadCaptureForm source={leadSource} submitLabel="Avisar quando lançar" />
      </div>
    </Section>
  );
}
