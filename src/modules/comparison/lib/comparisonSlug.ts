const SEPARATOR = "-vs-";

/**
 * URL canônica de uma comparação — sempre os dois slugs em ordem
 * alfabética, para que `/comparar/a-vs-b` e uma tentativa de acessar
 * `/comparar/b-vs-a` resolvam para a MESMA página (nunca conteúdo
 * duplicado sob duas URLs).
 */
export function encodeComparisonSlug(slugA: string, slugB: string): string {
  const [a, b] = [slugA, slugB].sort((x, y) => x.localeCompare(y));
  return `${a}${SEPARATOR}${b}`;
}

/**
 * Decodifica `pair` em dois slugs reais, tentando cada ponto onde
 * `-vs-` aparece como separador literal (um slug de produto poderia,
 * em tese, conter a substring `-vs-`) e validando cada metade contra
 * `knownSlugs` — nunca aceita um slug que não existe de verdade.
 */
export function decodeComparisonSlug(
  pair: string,
  knownSlugs: readonly string[],
): readonly [string, string] | null {
  const knownSet = new Set(knownSlugs);
  let searchFrom = 0;
  while (true) {
    const index = pair.indexOf(SEPARATOR, searchFrom);
    if (index === -1) return null;

    const a = pair.slice(0, index);
    const b = pair.slice(index + SEPARATOR.length);
    if (a && b && a !== b && knownSet.has(a) && knownSet.has(b)) {
      return [a, b];
    }
    searchFrom = index + 1;
  }
}

/** A comparação está na URL canônica (slugs em ordem alfabética)? */
export function isCanonicalComparisonSlug(pair: string, slugA: string, slugB: string): boolean {
  return pair === encodeComparisonSlug(slugA, slugB);
}
