import { prisma } from "../src/lib/db/prisma";
import { isTestSlug } from "../src/lib/catalog/testDataGuard";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Sprint "sem placeholder azul" — para cada produto publicado sem
 * imagem real: (1) tenta extrair a imagem oficial do produto via
 * `og:image` da própria página-fonte já registrada em
 * `attributes.sourceUrl` durante a publicação (nunca uma URL nova
 * inventada — só a fonte que já usamos para preço/composição);
 * convertida para WEBP + thumbnail, salva em `/public/products/`. (2)
 * Quando não há `sourceUrl`, a busca falha, ou o arquivo baixado não é
 * uma imagem válida, gera um card SVG elegante (marca + produto +
 * categoria + fundo gradiente) — nunca o placeholder azul genérico
 * antigo (`creatina-placeholder.svg`).
 */

const OUT_DIR = path.join(__dirname, "..", "public", "products");
const COVER_SIZE = 800;
const THUMB_SIZE = 200;

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  "whey-protein": ["#3b1d54", "#6d28d9"],
  creatina: ["#1d3b54", "#0ea5e9"],
  "pre-treino": ["#541d2b", "#dc2626"],
  "omega-3": ["#1d5442", "#059669"],
  cafeina: ["#4a3410", "#b45309"],
  bcaa: ["#2b1d54", "#7c3aed"],
  glutamina: ["#1d2e54", "#2563eb"],
  colageno: ["#541d3f", "#be185d"],
  melatonina: ["#241d54", "#4338ca"],
  zma: ["#3d1d54", "#8b5cf6"],
  hipercaloricos: ["#54371d", "#d97706"],
  "coenzima-q10": ["#1d5451", "#0d9488"],
  "barras-de-proteina": ["#4d3319", "#c2703d"],
  "pasta-de-amendoim": ["#4a3212", "#b8842e"],
};
const DEFAULT_GRADIENT: [string, string] = ["#1e2438", "#3b4364"];

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 4);
}

function buildCardSvg(params: {
  brandName: string;
  productName: string;
  categoryName: string;
  categorySlug: string;
}): string {
  const [c1, c2] = CATEGORY_GRADIENTS[params.categorySlug] ?? DEFAULT_GRADIENT;
  const lines = wrapText(params.productName, 22);
  const lineHeight = 30;
  const startY = 400 - ((lines.length - 1) * lineHeight) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="700" cy="100" r="220" fill="#ffffff" opacity="0.04"/>
  <circle cx="80" cy="720" r="160" fill="#ffffff" opacity="0.04"/>
  <text x="400" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" letter-spacing="4" fill="#ffffffcc">${escapeXml(params.brandName.toUpperCase())}</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="400" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`,
    )
    .join("\n  ")}
  <rect x="290" y="540" width="220" height="44" rx="22" fill="#ffffff1a" stroke="#ffffff33"/>
  <text x="400" y="568" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="2" fill="#ffffffdd">${escapeXml(params.categoryName.toUpperCase())}</text>
</svg>`;
}

/**
 * Estratégias em cascata, na ordem de confiabilidade observada: a
 * maioria dos e-commerces declara `og:image` (Shopify, WooCommerce,
 * Magento); lojas VTEX (ex.: Darkness) frequentemente não declaram
 * `og:image` mas expõem `twitter:image` ou um bloco JSON-LD `Product`
 * com `image` — nunca inventa a URL, só tenta locais diferentes da
 * MESMA página já usada como fonte de preço/composição.
 */
function extractProductImage(html: string): string | null {
  const og =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (og) return og[1];

  const twitter =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twitter) return twitter[1];

  // Só aceita JSON-LD do tipo `Product` — um node `Organization`/`WebSite`
  // também pode ter `image` (o logo da marca), e sem esse filtro o
  // "logo" acaba salvo como se fosse foto do produto (achado real desta
  // sprint: aconteceu com todo produto de darkness.com.br).
  const jsonLdBlocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const type = node?.["@type"];
        const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
        if (!isProduct) continue;
        const candidate = node?.image;
        const imageUrl = Array.isArray(candidate) ? candidate[0] : candidate;
        if (typeof imageUrl === "string" && imageUrl.startsWith("http")) return imageUrl;
        if (imageUrl && typeof imageUrl === "object" && typeof imageUrl.url === "string") {
          return imageUrl.url;
        }
      }
    } catch {
      // JSON-LD malformado — tenta o próximo bloco, nunca quebra o script.
    }
  }

  return null;
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "pt-BR,pt;q=0.9",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchBuffer(url: string, timeoutMs = 12000): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "pt-BR,pt;q=0.9",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 2000) return null;
    return buf;
  } catch {
    return null;
  }
}

/**
 * Recusa fontes que não são a página de UM produto específico — a
 * home ou uma página de listagem/marca tem `og:image` próprio (o logo
 * da marca, não a foto de nenhum produto), e usar isso salvaria o
 * mesmo logo genérico para vários produtos diferentes (achado real
 * desta sprint: aconteceu com `attributes.sourceUrl` apontando só para
 * `https://www.integralmedica.com.br/`).
 */
// Domínios de referência/conteúdo (bases nutricionais, blogs de review,
// agregadores) — nunca têm foto real do produto, só o próprio logo do
// site como `og:image`. Achado real desta sprint: fatsecret.com.br
// devolveu o logo do FatSecret, não a embalagem do produto.
// `amazon.com.br` entra aqui também: já documentado em várias sprints
// que bloqueia scraping simples, mas o achado NOVO desta sprint é que
// quando bloqueado ele devolve 200 com `og:image` = o logo genérico da
// Amazon (não um 403 limpo) — sem este bloqueio, o logo era salvo como
// se fosse a foto do produto.
const NON_RETAIL_DOMAINS = [
  "fatsecret.com.br",
  "openfoodfacts.org",
  "qualomelhoromega3.com.br",
  "amazon.com.br",
];

function looksLikeProductPage(sourceUrl: string): boolean {
  const { pathname, hostname } = new URL(sourceUrl);
  if (NON_RETAIL_DOMAINS.some((domain) => hostname.endsWith(domain))) return false;
  return pathname.replace(/\/+$/, "").length > 1;
}

async function tryRealImage(
  sourceUrl: string,
  slug: string,
): Promise<{ coverUrl: string; thumbUrl: string } | null> {
  if (!looksLikeProductPage(sourceUrl)) return null;

  const html = await fetchText(sourceUrl);
  if (!html) return null;

  let ogImage = extractProductImage(html);
  if (!ogImage) return null;
  if (ogImage.startsWith("//")) ogImage = "https:" + ogImage;
  if (ogImage.startsWith("/")) ogImage = new URL(ogImage, sourceUrl).toString();

  const buf = await fetchBuffer(ogImage);
  if (!buf) return null;

  try {
    const coverPath = path.join(OUT_DIR, `${slug}.webp`);
    const thumbPath = path.join(OUT_DIR, `${slug}-thumb.webp`);
    await sharp(buf)
      .resize(COVER_SIZE, COVER_SIZE, { fit: "contain", background: "#ffffff" })
      .webp({ quality: 85 })
      .toFile(coverPath);
    await sharp(buf)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "contain", background: "#ffffff" })
      .webp({ quality: 80 })
      .toFile(thumbPath);
    return { coverUrl: `/products/${slug}.webp`, thumbUrl: `/products/${slug}-thumb.webp` };
  } catch {
    return null;
  }
}

async function generateCard(params: {
  slug: string;
  brandName: string;
  productName: string;
  categoryName: string;
  categorySlug: string;
}): Promise<{ coverUrl: string; thumbUrl: string }> {
  const svg = buildCardSvg(params);
  const svgBuf = Buffer.from(svg);
  const coverPath = path.join(OUT_DIR, `${params.slug}-card.webp`);
  const thumbPath = path.join(OUT_DIR, `${params.slug}-card-thumb.webp`);
  await sharp(svgBuf).webp({ quality: 90 }).toFile(coverPath);
  await sharp(svgBuf).resize(THUMB_SIZE, THUMB_SIZE).webp({ quality: 85 }).toFile(thumbPath);
  return {
    coverUrl: `/products/${params.slug}-card.webp`,
    thumbUrl: `/products/${params.slug}-card-thumb.webp`,
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      attributes: true,
      brand: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      images: { where: { role: "COVER" }, select: { id: true, url: true } },
    },
  });

  let realCount = 0;
  let cardCount = 0;
  let skipped = 0;

  for (const product of products) {
    if (isTestSlug(product.slug) || isTestSlug(product.category.slug)) {
      skipped++;
      continue;
    }
    const currentUrl = product.images[0]?.url;
    const hasRealImage =
      currentUrl && !currentUrl.includes("card") && !currentUrl.includes("placeholder");
    const retryCards = process.env.RETRY_CARDS === "1";
    if (hasRealImage || (currentUrl && currentUrl.includes("card") && !retryCards)) {
      skipped++;
      continue; // já tem imagem real (nunca reprocessa); card só é retentado com RETRY_CARDS=1
    }

    const sourceUrl = (product.attributes as Record<string, unknown> | null)?.sourceUrl as
      string | undefined;

    let result = sourceUrl ? await tryRealImage(sourceUrl, product.slug) : null;
    const isReal = !!result;
    if (!result) {
      result = await generateCard({
        slug: product.slug,
        brandName: product.brand.name,
        productName: product.name,
        categoryName: product.category.name,
        categorySlug: product.category.slug,
      });
    }

    if (product.images[0]) {
      await prisma.productImage.update({
        where: { id: product.images[0].id },
        data: { url: result.coverUrl, altText: product.name },
      });
    } else {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: result.coverUrl,
          altText: product.name,
          role: "COVER",
        },
      });
    }

    if (isReal) {
      realCount++;
      console.warn(`[real]  ${product.slug} -> ${result.coverUrl}`);
    } else {
      cardCount++;
      console.warn(`[card]  ${product.slug} -> ${result.coverUrl}`);
    }
  }

  console.warn(
    `\nResumo: ${realCount} imagens reais, ${cardCount} cards gerados, ${skipped} ignorados (já tinham imagem ou são dado de teste).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
