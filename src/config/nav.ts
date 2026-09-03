export interface NavItem {
  label: string;
  href: string;
}

/** Navegação principal do header institucional. */
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
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
      { label: "Mercado", href: "/mercado" },
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
  { label: "Instagram", href: "https://instagram.com/suplecheck", icon: "instagram" as const },
  { label: "LinkedIn", href: "https://linkedin.com/company/suplecheck", icon: "linkedin" as const },
  { label: "YouTube", href: "https://youtube.com/@suplecheck", icon: "youtube" as const },
];
