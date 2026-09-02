import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Skeleton da página de produto — não pode reaproveitar `PageHeader`
 * como `/creatina/loading.tsx` faz, porque aqui o título é o próprio
 * nome do produto (dado, não texto estático). Aproxima a mesma
 * proporção do layout real (imagem 240px + coluna de detalhes) para
 * minimizar o "pulo" quando os dados chegam.
 */
export default function Loading() {
  return (
    <>
      <div className="border-border bg-bg-subtle border-b">
        <Container className="flex flex-col gap-4 py-12 md:py-16">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-2/3 max-w-xl" />
        </Container>
      </div>

      <Section className="border-border border-b">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <Skeleton className="h-60 w-full rounded-lg" />
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </Section>
    </>
  );
}
