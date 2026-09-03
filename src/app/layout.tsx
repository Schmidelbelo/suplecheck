import type { Metadata, Viewport } from "next";
import { Inter, Lexend, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { siteConfig } from "@/config/site";
import { AnalyticsScripts } from "@/modules/analytics/components/AnalyticsScripts";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  ...buildMetadata(),
  metadataBase: new URL(siteConfig.url),
  // Sem `icons` explícito: `icon.tsx`/`apple-icon.tsx` (convenção de
  // arquivo do Next) já geram e injetam as tags corretas — declarar
  // `icons` aqui sobrescreveria isso apontando para arquivos estáticos
  // que não existem (ver auditoria da FASE 1.5).
  manifest: "/manifest.webmanifest",
  // Verificação de propriedade no Google Search Console / Bing Webmaster
  // Tools — só emite a meta tag quando o respectivo código estiver
  // configurado (ver .env.example); sem a env, cada chave fica de fora
  // do objeto (Next não injeta uma tag vazia).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${lexend.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="focus:bg-brand focus:text-brand-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-toast) focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Pular para o conteúdo
        </a>
        <AppProviders>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </AppProviders>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
