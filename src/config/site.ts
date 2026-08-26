export const siteConfig = {
  name: "SupleCheck",
  title: "SupleCheck — Comparação inteligente de suplementos",
  description:
    "Rankings independentes de suplementos baseados em dados: o Índice SupleCheck compara qualidade, custo-benefício e composição para você decidir com segurança.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.suplecheck.com.br",
  locale: "pt_BR",
  themeColor: "#139d56",
  ogImage: "/og-image.png",
  keywords: [
    "suplementos",
    "creatina",
    "comparador de suplementos",
    "ranking de suplementos",
    "índice suplecheck",
    "whey protein",
  ],
  links: {
    instagram: "https://instagram.com/suplecheck",
  },
} as const;

export type SiteConfig = typeof siteConfig;
