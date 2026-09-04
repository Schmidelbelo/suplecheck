import { redirect } from "next/navigation";

/**
 * `/ranking` era o placeholder "em preparação" antes de qualquer
 * categoria ter um ranking real. Creatina é a primeira (e, por ora,
 * única) categoria com Índice SupleScore calculado de ponta a ponta —
 * quando houver mais de uma categoria com ranking real, isto vira uma
 * página de índice em vez de um redirect fixo.
 */
export default function RankingPage() {
  redirect("/creatina");
}
