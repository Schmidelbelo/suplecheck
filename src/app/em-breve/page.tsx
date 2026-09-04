import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = buildMetadata({
  title: "Em breve",
  description: "Esta funcionalidade do SupleScore ainda está em desenvolvimento.",
  path: "/em-breve",
  noIndex: true,
});

export default function ComingSoonPage() {
  return (
    <ComingSoon
      title="Esta página ainda está em construção"
      description="Estamos trabalhando para trazer essa funcionalidade em breve. Deixe seu e-mail para acompanhar as novidades do SupleScore."
      leadSource="generic_coming_soon"
    />
  );
}
