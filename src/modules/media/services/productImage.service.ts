import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { categoryBasePath, productDetailPath } from "@/lib/catalog/productRoutes";

/**
 * Sistema permanente de imagens — Vercel Blob, nunca filesystem local.
 * Toda imagem de produto (resolvida automaticamente ou enviada via
 * Central de Imagens) é convertida para WEBP em memória e enviada para
 * o Blob, que devolve uma URL pública permanente e imutável (`put`
 * com `addRandomSuffix: false` sobre um path fixo por produto —
 * reenviar a mesma imagem no mesmo path sobrescreve, nunca acumula
 * lixo). Funciona igual em dev e em produção na Vercel: nada escreve
 * em `/public`, nada depende do filesystem da função serverless
 * sobreviver entre invocações.
 *
 * Todo produto publicado termina em UM destes dois estados, nunca em
 * limbo:
 * 1. `ProductImage.url` aponta para uma URL do Blob (imagem oficial
 *    real) — o site nunca mais depende da URL de terceiros para aquele
 *    produto.
 * 2. Sem imagem oficial confiável encontrada: uma linha em
 *    `PendingImage` — a fila que a Central de Imagens (`/admin/imagens`)
 *    resolve com upload manual. Nunca mais um card ilustrativo gerado
 *    automaticamente como se fosse solução definitiva.
 */

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

/**
 * Converte pra WEBP (capa + thumbnail) e envia os dois pro Vercel Blob
 * num path fixo e previsível (`products/<slug>.webp`,
 * `products/<slug>-thumb.webp`) — `addRandomSuffix: false` garante que
 * reenviar a imagem do mesmo produto SOBRESCREVE o blob existente em
 * vez de acumular versões órfãs (o Blob de um produto excluído/trocado
 * nunca fica pra trás consumindo storage sem uso). Devolve a URL
 * pública permanente da capa.
 */
async function uploadWebpToBlob(
  buf: Buffer,
  slug: string,
  fit: "contain" | "cover",
): Promise<string> {
  const cover = await sharp(buf)
    .resize(COVER_SIZE, COVER_SIZE, { fit, background: "#ffffff" })
    .webp({ quality: 85 })
    .toBuffer();
  const thumb = await sharp(buf)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit, background: "#ffffff" })
    .webp({ quality: 80 })
    .toBuffer();

  const [coverBlob] = await Promise.all([
    put(`products/${slug}.webp`, cover, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    put(`products/${slug}-thumb.webp`, thumb, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
  ]);

  return coverBlob.url;
}

/**
 * Invalida o cache ISR da página do produto e da categoria — chamado
 * sempre que uma imagem é resolvida ou enviada, pra quem já tinha a
 * página em cache (até 12h, ver `revalidate` das páginas) ver a
 * imagem nova sem esperar a janela inteira.
 */
function invalidateProductCache(categorySlug: string | null, slug: string) {
  if (!categorySlug) return;
  try {
    revalidatePath(productDetailPath(categorySlug, slug));
    revalidatePath(categoryBasePath(categorySlug));
  } catch {
    // Fora de um request de servidor Next (ex.: script tsx standalone
    // rodando `prisma/publish*.ts`) `revalidatePath` não se aplica —
    // a página atualiza sozinha na próxima janela de `revalidate`.
  }
}

async function applyResolvedImage(
  productId: string,
  slug: string,
  url: string,
  categorySlug: string | null,
) {
  const image = await prisma.productImage.findFirst({ where: { productId, role: "COVER" } });
  if (image) {
    await prisma.productImage.update({ where: { id: image.id }, data: { url } });
  } else {
    await prisma.productImage.create({ data: { productId, url, role: "COVER" } });
  }
  await prisma.pendingImage.deleteMany({ where: { productId } });
  invalidateProductCache(categorySlug, slug);
}

/**
 * Tenta a fonte oficial já registrada em `attributes.sourceUrl` (nunca
 * uma URL inventada). Sucesso: baixa, converte pra WEBP, envia pro
 * Vercel Blob e atualiza o banco com a URL permanente — devolve
 * `true`. Falha (bloqueio, sem og:image, fonte genérica demais):
 * devolve `false`, o chamador decide o que fazer (normalmente:
 * enfileirar em `PendingImage`).
 */
export async function tryResolveOfficialImage(params: {
  productId: string;
  slug: string;
  sourceUrl: string | null | undefined;
  categorySlug?: string | null;
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
    const blobUrl = await uploadWebpToBlob(buf, params.slug, "contain");
    await applyResolvedImage(params.productId, params.slug, blobUrl, params.categorySlug ?? null);
    return true;
  } catch (error) {
    console.error("[productImage] falha ao enviar pro Blob", error);
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
 * Fluxo completo chamado por todo script de publicação novo: prioridade
 * 1) imagem já cadastrada no banco (nunca sobrescreve uma capa real
 * existente — só age quando não há `ProductImage` COVER ainda);
 * 2) tenta a fonte oficial automaticamente; 3) se falhar, enfileira
 * com o motivo — nunca deixa o produto sem imagem E sem estar na fila,
 * e nunca mais gera card ilustrativo sozinho.
 */
export async function resolveOrQueueProductImage(params: {
  productId: string;
  slug: string;
  productName: string;
  brandName: string;
  categoryName: string;
  categorySlug?: string | null;
  sourceUrl: string | null | undefined;
}): Promise<{ resolved: boolean }> {
  const existing = await prisma.productImage.findFirst({
    where: { productId: params.productId, role: "COVER" },
  });
  if (existing) return { resolved: true };

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
 * converte pra WEBP, envia pro Vercel Blob, atualiza o banco com a URL
 * permanente e tira o produto da fila. Se havia uma imagem anterior
 * (card ou foto) apontando pra um blob diferente, apaga o blob antigo
 * — nunca acumula arquivo órfão no storage.
 */
export async function saveUploadedProductImage(params: {
  productId: string;
  slug: string;
  fileBuffer: Buffer;
  categorySlug?: string | null;
}): Promise<void> {
  const previous = await prisma.productImage.findFirst({
    where: { productId: params.productId, role: "COVER" },
  });

  const blobUrl = await uploadWebpToBlob(params.fileBuffer, params.slug, "cover");
  await applyResolvedImage(params.productId, params.slug, blobUrl, params.categorySlug ?? null);

  if (
    previous?.url &&
    previous.url.includes("blob.vercel-storage.com") &&
    previous.url !== blobUrl
  ) {
    await del(previous.url).catch(() => {
      // Melhor esforço — um blob órfão não é grave o bastante pra falhar o upload.
    });
  }
}
