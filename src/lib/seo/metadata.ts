import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export interface BuildMetadataInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Fábrica única de metadata de página. Toda rota deve gerar seu <title>/
 * description/OG/Twitter a partir daqui — nunca hardcoded por página —
 * para manter consistência e permitir trocar a estratégia de SEO em um
 * único lugar.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.ogImage,
  noIndex = false,
}: BuildMetadataInput = {}): Metadata {
  const url = new URL(path, siteConfig.url).toString();
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
