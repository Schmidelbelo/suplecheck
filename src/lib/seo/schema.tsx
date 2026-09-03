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
    logo: new URL("/icon-512.png", siteConfig.url).toString(),
    sameAs: Object.values(siteConfig.links),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    // Sem `potentialAction`/`SearchAction` deliberadamente: a plataforma
    // não tem uma página de busca ainda — declarar uma aqui anunciaria
    // ao Google uma funcionalidade que não existe.
  };
}

/**
 * `FAQPage` — só deve ser usado na página que efetivamente renderiza as
 * perguntas como texto visível (não é permitido pelas diretrizes do
 * Google marcar conteúdo que não aparece na página) — hoje só a Home,
 * via `FAQSection`/`homeFaq`. Torna a plataforma elegível ao rich
 * result de FAQ na busca do Google sem custo de desenvolvimento
 * adicional (o conteúdo já existe e já é exibido).
 */
export function faqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** `ItemList` genérico — usado por páginas de listagem (ex.: `/ofertas`) que destacam um subconjunto de produtos, não o catálogo inteiro. */
export function itemListSchema(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: new URL(item.href, siteConfig.url).toString(),
    })),
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
  /** Índice SupleCheck já calculado para este produto — omitir quando ainda não houver avaliação. */
  score?: {
    /** 0–100. */
    value: number;
    /** Rótulo da faixa de classificação (ex.: "Excelente"). */
    label: string;
    /** ISO 8601 — data do cálculo, não da publicação da página. */
    calculatedAt: string;
  };
  priceInCents?: number;
  /** Loja onde a oferta pode ser efetivada — se omitido, usa a própria página do produto. */
  offerUrl?: string;
}

/**
 * `Product` + `Offer` + `Review` (nunca `AggregateRating`): o Índice
 * SupleCheck é UMA nota editorial calculada pelo Core Domain, não uma
 * média de várias avaliações de usuários independentes — usar
 * `AggregateRating` aqui seria estruturalmente incorreto (as diretrizes
 * de dados estruturados do Google reservam `AggregateRating` para
 * avaliações agregadas reais) e arriscaria a elegibilidade a rich
 * results da própria plataforma. `Review` com um único `Rating`, de
 * autoria da organização, é a representação fiel do que a plataforma
 * realmente calcula (ver `/metodologia`).
 */
export function productSchema(input: ProductSchemaInput) {
  const productUrl = new URL(`/creatina/${input.slug}`, siteConfig.url).toString();
  const imageUrl = new URL(input.image, siteConfig.url).toString();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: imageUrl,
    brand: { "@type": "Brand", name: input.brand },
    url: productUrl,
    ...(input.score
      ? {
          review: {
            "@type": "Review",
            name: `Avaliação SupleCheck: ${input.score.label}`,
            reviewRating: {
              "@type": "Rating",
              ratingValue: Math.round(input.score.value * 10) / 10,
              bestRating: 100,
              worstRating: 0,
            },
            author: { "@type": "Organization", name: siteConfig.name },
            datePublished: input.score.calculatedAt,
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
            url: input.offerUrl ?? productUrl,
          },
        }
      : {}),
  };
}

/**
 * Escapa `<`, `>` e `&` no JSON serializado antes de injetar via
 * `dangerouslySetInnerHTML`. Sem isto, um campo de texto vindo do banco
 * (nome/descrição de produto, por exemplo) contendo `</script><script>`
 * fecharia a tag `<script type="application/ld+json">` e injetaria
 * HTML/script arbitrário na página (stored XSS) — os valores usados aqui
 * (nome de produto, marca, descrição) vêm de dados persistidos, não de
 * literais de código, então não podem ser tratados como confiáveis.
 */
function escapeJsonForScriptTag(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScriptTag(JSON.stringify(data)) }}
    />
  );
}
