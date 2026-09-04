export const siteConfig = {
  name: "SupleScore",
  title: "SupleScore — Comparação inteligente de suplementos",
  description:
    "Rankings independentes de suplementos baseados em dados: o Índice SupleScore compara qualidade, custo-benefício e composição para você decidir com segurança.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://suplescore.com.br",
  locale: "pt_BR",
  themeColor: "#127c47",
  keywords: [
    "suplementos",
    "creatina",
    "comparador de suplementos",
    "ranking de suplementos",
    "índice suplescore",
    "whey protein",
  ],
  links: {
    instagram: "https://instagram.com/suplescore",
  },
} as const;

export type SiteConfig = typeof siteConfig;
