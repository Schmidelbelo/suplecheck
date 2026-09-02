import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Skeleton específico do ranking de creatina — o header (estático, sem
 * dependência de dados) aparece de imediato; só a lista de produtos, que
 * depende do fetch ao Ranking real, é substituída por placeholders no
 * mesmo formato do `RankingEntryCard` (evita "pulo" de layout quando os
 * dados chegam).
 */
export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Ranking"
        title="Qual a melhor creatina? Ranking comparativo"
        description="Cada produto é avaliado pelo Índice SupleCheck a partir de custo-benefício, transparência do rótulo, preço por dose, reputação, promessas de marketing e confiabilidade da loja — nunca patrocinado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Creatina" }]}
      />

      <Section>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Skeleton className="h-14 w-full sm:w-64" />
            <Skeleton className="h-14 w-full sm:w-64" />
          </div>

          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="border-border flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:p-6"
              >
                <Skeleton className="size-20 shrink-0 self-center rounded-md" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-10 w-24 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
