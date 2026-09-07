import { CalendarCheck, ShieldCheck, BadgeCheck, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";

/**
 * Selos reutilizáveis de confiança — sempre condicionados a um dado real
 * (data, URL, boolean vindo do banco). Nenhum selo aparece "porque sim":
 * se o dado que o justificaria não existe, o componente chamador
 * simplesmente não renderiza o selo (ver `ProductTrustPanel.tsx`).
 */

/** "Atualizado em {data}" — usa a data real do último cálculo de nota (nunca uma data fixa/estática). */
export function UpdatedBadge({ date }: { date: string | Date }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <CalendarCheck className="size-3.5" aria-hidden />
      Atualizado em {formatDate(date)}
    </Badge>
  );
}

/** Só deve ser usado quando o produto tem preço + composição realmente conferidos (nunca decorativo). */
export function VerifiedDataBadge() {
  return (
    <Badge variant="success" className="gap-1.5">
      <ShieldCheck className="size-3.5" aria-hidden />
      Dados verificados
    </Badge>
  );
}

/** Só deve ser usado quando existe uma captura de preço real (com URL de origem) para o produto. */
export function ConfirmedPriceBadge() {
  return (
    <Badge variant="brand" className="gap-1.5">
      <BadgeCheck className="size-3.5" aria-hidden />
      Preço confirmado
    </Badge>
  );
}

/** Selo institucional — sempre verdadeiro (a metodologia é pública em `/metodologia`), pode aparecer em qualquer contexto. */
export function PublicMethodologyBadge() {
  return (
    <Badge variant="outline" className="gap-1.5">
      <ScrollText className="size-3.5" aria-hidden />
      Metodologia pública
    </Badge>
  );
}
