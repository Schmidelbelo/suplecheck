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
          Receba o ranking assim que sair
        </h2>
        <p className="text-text-muted">
          Entre para a lista e seja avisado em primeira mão quando o ranking de creatinas e os
          próximos lançamentos do SupleCheck estiverem no ar. Sem spam.
        </p>
        <LeadCaptureForm source="home_newsletter" className="mt-2 w-full" />
      </div>
    </Section>
  );
}
