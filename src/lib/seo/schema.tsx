import { siteConfig } from "@/config/site";

/**
 * Geradores de JSON-LD (schema.org). Retornam objetos serializáveis para
 * serem injetados via <script type="application/ld+json"> nas páginas.
 * Mantidos aqui (e não espalhados pelas páginas) para que a estrutura de
 * dados estruturados evolua em um único lugar conforme o catálogo cresce.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: new URL("/icon.png", siteConfig.url).toString(),
    sameAs: Object.values(siteConfig.links),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/busca?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: new URL(item.href, siteConfig.url).toString(),
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  description: string;
  image: string;
  slug: string;
  brand: string;
  ratingValue?: number;
  reviewCount?: number;
  priceInCents?: number;
}

export function productSchema(input: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image,
    brand: { "@type": "Brand", name: input.brand },
    url: new URL(`/produtos/${input.slug}`, siteConfig.url).toString(),
    ...(input.ratingValue && input.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.ratingValue,
            reviewCount: input.reviewCount,
          },
        }
      : {}),
    ...(input.priceInCents
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: (input.priceInCents / 100).toFixed(2),
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"

      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
