export interface NavItem {
  label: string;
  href: string;
}

/** Navegação principal do header institucional. */
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Assistente", href: "/assistente" },
  { label: "Ranking", href: "/ranking" },
  { label: "Mercado", href: "/mercado" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Como Avaliamos", href: "/como-avaliamos" },
  { label: "Metodologia", href: "/metodologia" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Plataforma",
    items: [
      { label: "Ranking", href: "/ranking" },
      { label: "Marcas", href: "/marcas" },
      { label: "Categorias", href: "/categorias" },
      { label: "Comparar produtos", href: "/comparar" },
      { label: "Mercado", href: "/mercado" },
      { label: "Central de Alertas", href: "/alertas" },
      { label: "Como Avaliamos", href: "/como-avaliamos" },
      { label: "Metodologia", href: "/metodologia" },
      { label: "Como ganhamos dinheiro", href: "/como-ganhamos-dinheiro" },
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
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Termos de Uso", href: "/termos" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/suplescore", icon: "instagram" as const },
  { label: "LinkedIn", href: "https://linkedin.com/company/suplescore", icon: "linkedin" as const },
  { label: "YouTube", href: "https://youtube.com/@suplescore", icon: "youtube" as const },
];
