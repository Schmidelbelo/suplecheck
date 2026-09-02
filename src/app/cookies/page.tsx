import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Política de Cookies",
  description: "Quais cookies e tecnologias similares o SupleCheck utiliza e como controlá-los.",
  path: "/cookies",
});

const sections: LegalSection[] = [
  {
    title: "1. O que são cookies",
    body: (
      <p>
        Cookies são pequenos arquivos armazenados no seu navegador que permitem que um site lembre
        preferências e reconheça visitas recorrentes.
      </p>
    ),
  },
  {
    title: "2. Cookies que utilizamos",
    body: (
      <ul className="flex flex-col gap-2">
        <li>
          <strong className="text-text">Essenciais:</strong> necessários para funcionalidades
          básicas, como preferência de tema (claro/escuro).
        </li>
        <li>
          <strong className="text-text">Analytics:</strong> Google Analytics e Microsoft Clarity,
          usados para entender como o site é navegado, de forma agregada e anonimizada.
        </li>
      </ul>
    ),
  },
  {
    title: "3. Como controlar cookies",
    body: (
      <p>
        A maioria dos navegadores permite bloquear ou apagar cookies nas configurações de
        privacidade. Bloquear cookies essenciais pode afetar o funcionamento de algumas partes do
        site.
      </p>
    ),
  },
  {
    title: "4. Mais informações",
    body: (
      <p>
        Para entender como tratamos dados pessoais de forma geral, consulte nossa{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Política de Cookies"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Cookies" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="26 de agosto de 2026" />
      </Section>
    </>
  );
}
