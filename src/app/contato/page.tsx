import type { Metadata } from "next";
import { Camera, Mail } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = buildMetadata({
  title: "Contato",
  description:
    "Fale com o SupleCheck: dúvidas, sugestões de produtos para avaliar, parcerias comerciais ou correção de dados.",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Contato", href: "/contato" },
        ])}
      />
      <PageHeader
        eyebrow="Fale com a gente"
        title="Contato"
        description="Dúvidas, sugestões de produtos, parcerias ou correção de algum dado — escolha o assunto e mande sua mensagem."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contato" }]}
      />

      <Section>
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <ContactForm />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="bg-brand-subtle text-brand flex size-10 shrink-0 items-center justify-center rounded-md">
                <Mail className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-text text-sm font-semibold">E-mail</h2>
                <p className="text-text-muted text-sm">contato@suplecheck.com.br</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-brand-subtle text-brand flex size-10 shrink-0 items-center justify-center rounded-md">
                <Camera className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-text text-sm font-semibold">Redes sociais</h2>
                <p className="text-text-muted text-sm">@suplecheck em todas as redes</p>
              </div>
            </div>

            <p className="text-text-subtle text-sm">
              Tempo médio de resposta: até 3 dias úteis. Sugestões de produto entram na fila de
              curadoria e não recebem resposta individual.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
