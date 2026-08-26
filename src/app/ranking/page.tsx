import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = buildMetadata({
  title: "Ranking de Creatinas",
  description:
    "O primeiro ranking do SupleCheck: comparação de creatinas por composição, pureza e custo-benefício. Em preparação.",
  path: "/ranking",
});

export default function RankingPage() {
  return (
    <ComingSoon
      eyebrow="Primeira categoria"
      title="O ranking de creatinas está em preparação"
      description="Estamos finalizando a coleta e a análise de composição dos produtos. Deixe seu e-mail para ser avisado assim que o ranking completo, com nota do Índice SupleCheck, estiver disponível."
      leadSource="ranking_page"
    />
  );
}
