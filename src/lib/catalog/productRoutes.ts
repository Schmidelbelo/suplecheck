/**
 * Único lugar do projeto que sabe montar a URL pública de uma categoria
 * ou de um produto dentro dela. Toda página/componente que hoje monta
 * um link de produto deve chamar `productDetailPath`/`categoryBasePath`
 * daqui — nunca escrever `/creatina/${slug}` (ou qualquer outro prefixo
 * fixo) diretamente, para nunca quebrar quando o produto for de outra
 * categoria.
 *
 * `creatina` tem rota própria (`/creatina`, `/creatina/[slug]`) por ser
 * a categoria fundadora da plataforma, com URLs já indexadas — trocar
 * agora seria uma migração de SEO desnecessária. Qualquer outra
 * categoria usa a rota genérica `/categorias/[slug]` /
 * `/categorias/[slug]/[produto]`. Este é o único lugar que precisa
 * saber dessa exceção (mesmo contrato já usado por
 * `sitemap-produtos.xml` e por `/categorias/[slug]/page.tsx` antes
 * desta sprint — agora centralizado aqui, sem duplicação).
 */
export const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

/** Caminho da página de listagem/ranking de uma categoria (`/creatina` ou `/categorias/{slug}`). */
export function categoryBasePath(categorySlug: string): string {
  return CATEGORY_ROUTE_OVERRIDES[categorySlug] ?? `/categorias/${categorySlug}`;
}

/** Caminho da página de detalhe de um produto, dado a categoria REAL a que ele pertence. */
export function productDetailPath(categorySlug: string, productSlug: string): string {
  return `${categoryBasePath(categorySlug)}/${productSlug}`;
}
