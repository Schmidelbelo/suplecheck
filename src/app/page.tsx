import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";

/**
 * Placeholder da home. A landing page real (Fase 0: hero, Índice
 * SupleCheck, ranking de creatinas, captura de e-mail) é implementada na
 * próxima etapa — este componente só confirma que a fundação (layout,
 * design system, providers) está funcionando.
 */
export default function HomePage() {
  return (
    <Section className="flex flex-col items-center gap-4 text-center">
      <Badge variant="brand">Fundação da plataforma</Badge>
      <h1 className="font-display text-text text-4xl font-bold md:text-5xl">
        Suple<span className="text-brand">Check</span>
      </h1>
      <p className="text-text-muted max-w-xl">
        Infraestrutura base pronta. O conteúdo desta página (hero, ranking, captura de e-mail) chega
        na próxima etapa.
      </p>
    </Section>
  );
}
