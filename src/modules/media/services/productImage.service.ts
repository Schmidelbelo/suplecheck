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

// Domínios confirmados em sprints anteriores como fonte confiável real
// (loja oficial ou revendedor que já entregou foto correta, conferida
// visualmente) — soma pontos extras no score de confiança da Fase 1.
const TRUSTED_DOMAINS = [
  "vitafor.com.br",
  "darkness.com.br",
  "duxhumanhealth.com",
  "maxtitanium.com.br",
  "integralmedica.com.br",
  "probiotica.com.br",
  "blackskullusa.com.br",
  "brasilfitsuplementos.com.br",
  "gsuplementos.com.br",
  "loja.nutrata.com.br",
  "optimumnutrition.com",
  "drogasil.com.br",
  "drogaraia.com.br",
  "drogariasaopaulo.com.br",
  "mercadaosuplementos.com.br",
];

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Score heurístico 0–1 — nunca prova visual de que a embalagem é a
 * certa (isso continua exigindo revisão humana pra casos limítrofes),
 * só combina os sinais automáticos disponíveis: domínio já confiável,
 * resolução da imagem, e se veio de `og:image` (mais confiável) vs
 * `twitter:image`/JSON-LD (um pouco menos).
 */
function computeConfidence(params: {
  sourceUrl: string;
  width: number;
  height: number;
  extractionMethod: "og" | "twitter" | "jsonld";
}): number {
  let score = 0.4;
  const host = hostnameOf(params.sourceUrl);
  if (TRUSTED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) score += 0.25;
  if (params.width >= 500 && params.height >= 500) score += 0.25;
  else if (params.width >= 300 && params.height >= 300) score += 0.1;
  else score -= 0.3;
  if (params.extractionMethod === "og") score += 0.1;
  else if (params.extractionMethod === "jsonld") score += 0.05;
  return Math.max(0, Math.min(1, score));
}

const CONFIDENCE_APPROVE_THRESHOLD = 0.6;

/**
 * FASE 1 — Descoberta. Procura a imagem oficial (mesma cascata
 * og:image → twitter:image → JSON-LD `Product`), mas NUNCA envia nada
 * pro Blob nem toca `ProductImage` — só grava o candidato encontrado
 * (ou o motivo da rejeição/ausência) em `PendingImage`. Funciona 100%
 * sem storage permanente configurado; a Fase 2
 * (`uploadApprovedCandidate`) é quem baixa de novo e publica.
 */
export async function discoverProductImageCandidate(params: {
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  sourceUrl: string | null | undefined;
}): Promise<{ status: "APPROVED" | "REJECTED" | "PENDING"; confidence: number | null }> {
  const base = {
    productId: params.productId,
    productName: params.productName,
    brandName: params.brandName,
    categoryName: params.categoryName,
  };

  if (!params.sourceUrl || !looksLikeProductPage(params.sourceUrl)) {
    await prisma.pendingImage.upsert({
      where: { productId: params.productId },
      create: {
        ...base,
        status: "PENDING",
        reason: !params.sourceUrl
          ? "Nenhuma URL de fonte oficial registrada para este produto."
          : "A fonte registrada é uma home/listagem genérica, não a página de um produto específico — nunca usada pra evitar pegar o logo da marca.",
      },
      update: {
        status: "PENDING",
        candidateUrl: null,
        confidence: null,
        width: null,
        height: null,
        source: null,
        reason: !params.sourceUrl
          ? "Nenhuma URL de fonte oficial registrada para este produto."
          : "A fonte registrada é uma home/listagem genérica, não a página de um produto específico.",
      },
    });
    return { status: "PENDING", confidence: null };
  }

  const html = await fetchText(params.sourceUrl);
  if (!html) {
    await prisma.pendingImage.upsert({
      where: { productId: params.productId },
      create: {
        ...base,
        status: "PENDING",
        sourceUrl: params.sourceUrl,
        reason: "Fonte não respondeu (bloqueio do site, timeout, ou erro de rede).",
      },
      update: {
        status: "PENDING",
        sourceUrl: params.sourceUrl,
        candidateUrl: null,
        confidence: null,
        reason: "Fonte não respondeu (bloqueio do site, timeout, ou erro de rede).",
      },
    });
    return { status: "PENDING", confidence: null };
  }

  let candidateUrl = extractProductImage(html);
  if (!candidateUrl) {
    await prisma.pendingImage.upsert({
      where: { productId: params.productId },
      create: {
        ...base,
        status: "PENDING",
        sourceUrl: params.sourceUrl,
        reason: "Página carregou, mas não expõe og:image, twitter:image nem JSON-LD Product.",
      },
      update: {
        status: "PENDING",
        sourceUrl: params.sourceUrl,
        candidateUrl: null,
        confidence: null,
        reason: "Página carregou, mas não expõe og:image, twitter:image nem JSON-LD Product.",
      },
    });
    return { status: "PENDING", confidence: null };
  }
  if (candidateUrl.startsWith("//")) candidateUrl = "https:" + candidateUrl;
  if (candidateUrl.startsWith("/"))
    candidateUrl = new URL(candidateUrl, params.sourceUrl).toString();

  const extractionMethod: "og" | "twitter" | "jsonld" = html.includes(candidateUrl.slice(0, 40))
    ? "og"
    : "jsonld";

  const buf = await fetchImageBuffer(candidateUrl);
  if (!buf) {
    await prisma.pendingImage.upsert({
      where: { productId: params.productId },
      create: {
        ...base,
        status: "REJECTED",
        sourceUrl: params.sourceUrl,
        candidateUrl,
        reason: "Candidato encontrado, mas o download da imagem falhou (bloqueio ou URL quebrada).",
      },
      update: {
        status: "REJECTED",
        sourceUrl: params.sourceUrl,
        candidateUrl,
        confidence: null,
        reason: "Candidato encontrado, mas o download da imagem falhou (bloqueio ou URL quebrada).",
      },
    });
    return { status: "REJECTED", confidence: null };
  }

  const meta = await sharp(buf).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const confidence = computeConfidence({
    sourceUrl: params.sourceUrl,
    width,
    height,
    extractionMethod,
  });
  const status = confidence >= CONFIDENCE_APPROVE_THRESHOLD ? "APPROVED" : "REJECTED";
  const reason =
    status === "APPROVED"
      ? "Candidato aprovado automaticamente — aguardando Fase 2 (upload pro Blob)."
      : `Candidato encontrado mas com confiança baixa (${confidence.toFixed(2)}) — resolução ${width}x${height}, fonte ${hostnameOf(params.sourceUrl)}. Precisa de revisão humana antes de publicar.`;

  await prisma.pendingImage.upsert({
    where: { productId: params.productId },
    create: {
      ...base,
      status,
      sourceUrl: params.sourceUrl,
      candidateUrl,
      confidence,
      width,
      height,
      source: hostnameOf(params.sourceUrl),
      reason,
    },
    update: {
      status,
      sourceUrl: params.sourceUrl,
      candidateUrl,
      confidence,
      width,
      height,
      source: hostnameOf(params.sourceUrl),
      reason,
    },
  });

  return { status, confidence };
}

/**
 * FASE 2 — Upload. Roda quando o Blob existe: baixa de novo a
 * `candidateUrl` de cada `PendingImage` com `status = APPROVED`,
 * converte pra WEBP, envia pro Blob, atualiza `ProductImage` e apaga a
 * linha da fila. Nunca reaproveita bytes já baixados na Fase 1 — a
 * imagem pode ter mudado entre a descoberta e o upload.
 */
export async function uploadApprovedCandidate(pending: {
  productId: string;
  slug: string;
  candidateUrl: string;
  categorySlug: string | null;
}): Promise<boolean> {
  const buf = await fetchImageBuffer(pending.candidateUrl);
  if (!buf) return false;
  try {
    const blobUrl = await uploadWebpToBlob(buf, pending.slug, "contain");
    await applyResolvedImage(pending.productId, pending.slug, blobUrl, pending.categorySlug);
    return true;
  } catch (error) {
    console.error("[productImage] Fase 2 falhou ao enviar pro Blob", error);
    return false;
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
  if (isRealCoverUrl(existing?.url)) return { resolved: true };

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

/**
 * Uma capa só conta como "resolvida de verdade" quando não é
 * placeholder/card ilustrativo — usado em todo lugar que precisa
 * responder "esse produto já tem foto real?" (guardrail, discovery,
 * admin). Nunca duplicar essa checagem à mão em outro arquivo.
 */
export function isRealCoverUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return !url.includes("card") && !url.includes("placeholder");
}

/**
 * Publica no Blob um candidato já aprovado na Fase 1 — usado tanto
 * pelo botão individual quanto pelo "publicar todos" da Central de
 * Imagens. Nunca sobrescreve uma capa real já existente (mesma regra
 * de `resolveOrQueueProductImage`).
 */
export async function publishApprovedPendingImage(
  pendingImageId: string,
): Promise<{ status: "published"; url: string } | { status: "skipped"; reason: string }> {
  const pending = await prisma.pendingImage.findUnique({
    where: { id: pendingImageId },
    include: {
      product: { select: { id: true, slug: true, category: { select: { slug: true } } } },
    },
  });
  if (!pending) return { status: "skipped", reason: "Candidato não encontrado na fila." };
  if (pending.status !== "APPROVED" || !pending.candidateUrl) {
    return { status: "skipped", reason: "Candidato não está aprovado ou não tem URL." };
  }

  const existingCover = await prisma.productImage.findFirst({
    where: { productId: pending.productId, role: "COVER" },
  });
  if (isRealCoverUrl(existingCover?.url)) {
    // Já tem capa real — a fila ficou órfã, limpa sem publicar de novo.
    await prisma.pendingImage.delete({ where: { id: pending.id } });
    return { status: "skipped", reason: "Produto já tinha capa real — fila limpa." };
  }

  const published = await uploadApprovedCandidate({
    productId: pending.productId,
    slug: pending.product.slug,
    candidateUrl: pending.candidateUrl,
    categorySlug: pending.product.category.slug,
  });
  if (!published) {
    return { status: "skipped", reason: "Falha ao baixar/enviar a imagem candidata pro Blob." };
  }

  const updated = await prisma.productImage.findFirst({
    where: { productId: pending.productId, role: "COVER" },
  });
  return { status: "published", url: updated!.url };
}

/**
 * Guardrail: todo produto `PUBLISHED` termina em UM dos dois estados
 * válidos — capa real, ou uma linha em `PendingImage` — nunca nenhum
 * dos dois (gap silencioso) nem os dois ao mesmo tempo (fila órfã
 * depois que a capa real já foi resolvida por outro caminho, ex.:
 * upload manual direto). Roda a cada carregamento da Central de
 * Imagens — idempotente, seguro rodar quantas vezes quiser.
 */
export async function runImageGuardrail(): Promise<{ queued: number; cleaned: number }> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { where: { role: "COVER" }, select: { url: true } },
      pendingImage: { select: { id: true } },
    },
  });

  let queued = 0;
  let cleaned = 0;

  for (const product of products) {
    const hasRealCover = isRealCoverUrl(product.images[0]?.url);

    if (hasRealCover && product.pendingImage) {
      await prisma.pendingImage.delete({ where: { id: product.pendingImage.id } });
      cleaned++;
      continue;
    }

    if (!hasRealCover && !product.pendingImage) {
      await queuePendingImage({
        productId: product.id,
        productName: product.name,
        brandName: product.brand.name,
        categoryName: product.category.name,
        reason:
          "Produto publicado sem capa real e sem candidato — enfileirado automaticamente pelo guardrail.",
      });
      queued++;
    }
  }

  return { queued, cleaned };
}
