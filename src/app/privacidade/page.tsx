import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { LegalContent, type LegalSection } from "@/components/shared/LegalContent";

export const metadata: Metadata = buildMetadata({
  title: "Política de Privacidade",
  description:
    "Como o SupleCheck coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
  path: "/privacidade",
});

const sections: LegalSection[] = [
  {
    title: "1. Quais dados coletamos",
    body: (
      <p>
        Coletamos o e-mail informado voluntariamente em formulários de newsletter e contato, dados
        de navegação anonimizados via ferramentas de analytics (como páginas visitadas e origem do
        acesso) e, quando você cria uma conta (funcionalidade futura), nome e e-mail associados ao
        perfil.
      </p>
    ),
  },
  {
    title: "2. Como usamos seus dados",
    body: (
      <ul className="flex flex-col gap-2">
        <li>Enviar o ranking e novidades para quem se cadastrou na newsletter;</li>
        <li>Responder mensagens enviadas pela página de Contato;</li>
        <li>Entender como o site é usado, para melhorar conteúdo e navegação;</li>
        <li>Cumprir obrigações legais, quando aplicável.</li>
      </ul>
    ),
  },
  {
    title: "3. Compartilhamento com terceiros",
    body: (
      <p>
        Não vendemos dados pessoais. Utilizamos provedores de infraestrutura (hospedagem, e-mail
        transacional) e de analytics (Google Analytics, Microsoft Clarity) que processam dados em
        nosso nome, sob os termos de privacidade de cada provedor.
      </p>
    ),
  },
  {
    title: "4. Seus direitos (LGPD)",
    body: (
      <p>
        Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar a qualquer
        momento a confirmação da existência de tratamento, acesso, correção, anonimização,
        portabilidade ou eliminação dos seus dados pessoais, além de revogar consentimentos dados
        anteriormente. Solicitações podem ser feitas pela página de <a href="/contato">Contato</a>.
      </p>
    ),
  },
  {
    title: "5. Retenção e segurança",
    body: (
      <p>
        Mantemos seus dados apenas pelo tempo necessário às finalidades descritas acima, com medidas
        técnicas e organizacionais razoáveis para proteger contra acesso não autorizado, perda ou
        alteração indevida.
      </p>
    ),
  },
  {
    title: "6. Cookies",
    body: (
      <p>
        Para detalhes sobre o uso de cookies e tecnologias similares, consulte nossa{" "}
        <a href="/cookies">Política de Cookies</a>.
      </p>
    ),
  },
  {
    title: "7. Alterações desta política",
    body: (
      <p>
        Esta política pode ser atualizada periodicamente. Mudanças relevantes serão comunicadas
        nesta página, com a data de atualização revisada no topo.
      </p>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Política de Privacidade"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Política de Privacidade" }]}
      />
      <Section>
        <LegalContent sections={sections} lastUpdated="26 de agosto de 2026" />
      </Section>
    </>
  );
}
