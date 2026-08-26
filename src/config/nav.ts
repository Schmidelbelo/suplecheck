export interface NavItem {
  label: string;
  href: string;
}

/**
 * Navegação principal do site público. Itens de fases futuras (Comparador,
 * Categorias) já existem aqui, mesmo apontando para rotas ainda vazias —
 * a ativação real é controlada por feature flag (ver config/features.ts).
 */
export const primaryNav: NavItem[] = [
  { label: "Categorias", href: "/categorias" },
  { label: "Ranking", href: "/categorias/creatina" },
  { label: "Comparador", href: "/comparar" },
  { label: "Artigos", href: "/artigos" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Plataforma",
    items: [
      { label: "Categorias", href: "/categorias" },
      { label: "Comparador", href: "/comparar" },
      { label: "Índice SupleCheck", href: "/sobre/indice" },
    ],
  },
  {
    title: "Empresa",
    items: [
      { label: "Sobre", href: "/sobre" },
      { label: "Contato", href: "/contato" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
    ],
  },
];
