import Link from "next/link";
import { HelpCircle, ListChecks, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/format";

/**
 * "Por que confiar nesta nota?" — explica, em uma frase, a garantia
 * estrutural por trás de qualquer nota do SupleScore (mesma fórmula
 * pública para qualquer produto, sem posição paga). Texto institucional
 * fixo — não depende de dado por produto, por isso não recebe props.
 */
export function WhyTrustCard() {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <div className="bg-brand-subtle text-brand flex size-10 shrink-0 items-center justify-center rounded-md">
          <HelpCircle className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-text text-sm font-semibold">Por que confiar nesta nota?</h3>
          <p className="text-text-muted text-sm">
            Todo produto do catálogo é avaliado pela mesma fórmula pública, com os mesmos seis
            critérios e pesos — nenhuma marca paga para ter nota melhor. Veja a{" "}
            <Link href="/metodologia" className="text-brand font-medium hover:underline">
              metodologia completa
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * "Como este produto foi avaliado" — resume, com dado real do próprio
 * produto, quantos critérios entraram na nota e aponta para o
 * detalhamento (`ScoreBreakdownList`, já existente na página do
 * produto) em vez de repetir a lista aqui.
 */
export function HowEvaluatedCard({ criteriaCount }: { criteriaCount: number }) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <div className="bg-brand-subtle text-brand flex size-10 shrink-0 items-center justify-center rounded-md">
          <ListChecks className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-text text-sm font-semibold">Como este produto foi avaliado</h3>
          <p className="text-text-muted text-sm">
            {criteriaCount} critério{criteriaCount === 1 ? "" : "s"} objetivo
            {criteriaCount === 1 ? "" : "s"} entraram no cálculo desta nota — o detalhamento de cada
            um está logo abaixo, em &ldquo;Critérios utilizados&rdquo;.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** "Última revisão" — sempre a partir de `score.calculatedAt` real, nunca uma data decorativa. */
export function LastRevisionCard({ calculatedAt }: { calculatedAt: string | Date }) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <div className="bg-brand-subtle text-brand flex size-10 shrink-0 items-center justify-center rounded-md">
          <History className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-text text-sm font-semibold">Última revisão</h3>
          <p className="text-text-muted text-sm">
            Este produto foi reavaliado em {formatDate(calculatedAt)}. Consulte o{" "}
            <Link href="/politica-de-correcoes" className="text-brand font-medium hover:underline">
              histórico de avaliação
            </Link>{" "}
            completo mais abaixo, ou nossa política de correções para saber quando e por que uma
            nota é recalculada.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
