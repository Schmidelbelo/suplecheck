/**
 * Filtra por orçamento máximo — produtos sem preço conhecido nunca são
 * descartados (não há como julgá-los contra um teto que não se sabe se
 * ultrapassam), e se o filtro eliminar TODO o conjunto (orçamento
 * incompatível com o catálogo real), a lista completa é devolvida em
 * vez de uma recomendação vazia — nunca um resultado silenciosamente
 * enganoso.
 */
export function filterWithinBudget<T extends { readonly priceCents: number | null }>(
  items: readonly T[],
  maxBudgetCents: number | null,
): readonly T[] {
  if (maxBudgetCents == null) return items;

  const withinBudget = items.filter(
    (item) => item.priceCents == null || item.priceCents <= maxBudgetCents,
  );
  return withinBudget.length > 0 ? withinBudget : items;
}
