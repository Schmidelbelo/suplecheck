import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";

/**
 * Sistema permanente de imagens — substitui as tentativas pontuais de
 * scraping por sprint. Todo produto publicado, novo ou existente,
 * termina em UM destes dois estados, nunca em limbo:
 * 1. `ProductImage.url` aponta para um arquivo local em
 *    `/public/products/` (imagem oficial real, convertida para WEBP) —
 *    o site nunca mais depende da URL de terceiros para aquele produto.
 * 2. Sem imagem oficial confiável encontrada: uma linha em
 *    `PendingImage` — a fila que a Central de Imagens (`/admin/imagens`)
 *    resolve com upload manual. Nunca mais um card ilustrativo gerado
 *    automaticamente como se fosse solução definitiva.
 */

const OUT_DIR = path.join(process.cwd(), "public", "products");
const COVER_SIZE = 800;
const THUMB_SIZE = 200;

// Domínios que nunca têm foto real do produto — bases de referência
// nutricional, agregadores, ou marketplaces que devolvem o próprio
// logo como `og:image` quando bloqueiam scraping (achado real: Amazon
// devolve 200 com og:image = logo da Amazon, não a embalagem).
const NON_RETAIL_DOMAINS = [
  "fatsecret.com.br",
  "openfoodfacts.org",
  "qualomelhoromega3.com.br",
  "amazon.com.br",
];

function extractProductImage(html: string): string | null {
  const og =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (og) return og[1];

  const twitter =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twitter) return twitter[1];

  // Só JSON-LD do tipo `Product` — `Organization`/`WebSite` também tem
  // `image` (o logo da marca), sem esse filtro o logo vira "foto do
  // produto" (achado real, aconteceu com darkness.com.br).
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
      // JSON-LD malformado — tenta o próximo bloco.
    }
  }
  return null;
}

function looksLikeProductPage(sourceUrl: string): boolean {
  const { pathname, hostname } = new URL(sourceUrl);
  if (NON_RETAIL_DOMAINS.some((domain) => hostname.endsWith(domain))) return false;
  return pathname.replace(/\/+$/, "").length > 1;
}

const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "accept-language": "pt-BR,pt;q=0.9",
};

async function fetchText(url: string, timeoutMs = 12000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchImageBuffer(url: string, timeoutMs = 12000): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS });
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

async function saveWebp(buf: Buffer, slug: string, coverFit: "contain" | "cover") {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await sharp(buf)
    .resize(COVER_SIZE, COVER_SIZE, { fit: coverFit, background: "#ffffff" })
    .webp({ quality: 85 })
    .toFile(path.join(OUT_DIR, `${slug}.webp`));
  await sharp(buf)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: coverFit, background: "#ffffff" })
    .webp({ quality: 80 })
    .toFile(path.join(OUT_DIR, `${slug}-thumb.webp`));
}

async function applyResolvedImage(productId: string, slug: string) {
  const image = await prisma.productImage.findFirst({ where: { productId, role: "COVER" } });
  const url = `/products/${slug}.webp`;
  if (image) {
    await prisma.productImage.update({ where: { id: image.id }, data: { url } });
  } else {
    await prisma.productImage.create({ data: { productId, url, role: "COVER" } });
  }
  await prisma.pendingImage.deleteMany({ where: { productId } });
}

/**
 * Tenta a fonte oficial já registrada em `attributes.sourceUrl` (nunca
 * uma URL inventada). Sucesso: baixa, converte pra WEBP, salva local e
 * atualiza o banco — devolve `true`. Falha (bloqueio, sem og:image,
 * fonte genérica demais): devolve `false`, o chamador decide o que
 * fazer (normalmente: enfileirar em `PendingImage`).
 */
export async function tryResolveOfficialImage(params: {
  productId: string;
  slug: string;
  sourceUrl: string | null | undefined;
}): Promise<boolean> {
  if (!params.sourceUrl || !looksLikeProductPage(params.sourceUrl)) return false;

  const html = await fetchText(params.sourceUrl);
  if (!html) return false;

  let imageUrl = extractProductImage(html);
  if (!imageUrl) return false;
  if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
  if (imageUrl.startsWith("/")) imageUrl = new URL(imageUrl, params.sourceUrl).toString();

  const buf = await fetchImageBuffer(imageUrl);
  if (!buf) return false;

  try {
    await saveWebp(buf, params.slug, "contain");
    await applyResolvedImage(params.productId, params.slug);
    return true;
  } catch {
    return false;
  }
}

/** Enfileira o produto na Central de Imagens — nunca gera card automaticamente. */
export async function queuePendingImage(params: {
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  reason: string;
}): Promise<void> {
  await prisma.pendingImage.upsert({
    where: { productId: params.productId },
    create: {
      productId: params.productId,
      productName: params.productName,
      brandName: params.brandName,
      categoryName: params.categoryName,
      reason: params.reason,
    },
    update: { reason: params.reason },
  });
}

/**
 * Fluxo completo chamado por todo script de publicação novo: tenta a
 * imagem oficial e, se falhar, enfileira com o motivo — nunca deixa o
 * produto sem imagem E sem estar na fila.
 */
export async function resolveOrQueueProductImage(params: {
  productId: string;
  slug: string;
  productName: string;
  brandName: string;
  categoryName: string;
  sourceUrl: string | null | undefined;
}): Promise<{ resolved: boolean }> {
  const resolved = await tryResolveOfficialImage(params);
  if (resolved) return { resolved: true };

  const reason = !params.sourceUrl
    ? "Nenhuma URL de fonte oficial registrada para este produto."
    : "Não foi possível extrair uma imagem oficial confiável da fonte registrada (bloqueio do site, página sem imagem, ou fonte genérica).";

  await queuePendingImage({
    productId: params.productId,
    productName: params.productName,
    brandName: params.brandName,
    categoryName: params.categoryName,
    reason,
  });
  return { resolved: false };
}

/**
 * Upload manual (Central de Imagens) — corta automaticamente para
 * quadrado (`cover`: preenche e recorta ao centro, nunca distorce),
 * converte pra WEBP, salva local, atualiza o banco e tira o produto da
 * fila. Único caminho de escrita de imagem que não depende de rede
 * nenhuma — o arquivo já chegou no upload.
 */
export async function saveUploadedProductImage(params: {
  productId: string;
  slug: string;
  fileBuffer: Buffer;
}): Promise<void> {
  await saveWebp(params.fileBuffer, params.slug, "cover");
  await applyResolvedImage(params.productId, params.slug);
}
