import { Mail } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { LeadCaptureForm } from "@/modules/leads/components/LeadCaptureForm";

export function NewsletterSection() {
  return (
    <Section id="newsletter" className="border-border border-b">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <div className="bg-brand-subtle text-brand flex size-12 items-center justify-center rounded-full">
          <Mail className="size-5" aria-hidden />
        </div>
        <h2 className="font-display text-text text-2xl font-bold md:text-3xl">
          Seja avisado quando novas categorias chegarem
        </h2>
        <p className="text-text-muted">
          O ranking de creatinas já está no ar. Entre para a lista para saber em primeira mão quando
          avaliarmos a próxima categoria de suplementos. Sem spam.
        </p>
        <LeadCaptureForm source="home_newsletter" className="mt-2 w-full" />
      </div>
    </Section>
  );
}
