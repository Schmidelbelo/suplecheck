import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";
import { saveUploadedProductImage } from "@/modules/media/services/productImage.service";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — generoso pra foto de embalagem, recusa lixo/engano

/**
 * Upload manual da Central de Imagens — recebe `multipart/form-data`
 * com `productId` + `file` (a imagem arrastada/selecionada). Corta
 * automaticamente pra quadrado, converte pra WEBP, salva local,
 * atualiza `ProductImage` e remove o produto de `PendingImage`. Nunca
 * depende de rede — o arquivo já chegou no corpo da requisição.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const productId = form.get("productId");
    const file = form.get("file");

    if (typeof productId !== "string" || !productId) {
      return NextResponse.json(
        { code: "INVALID_BODY", message: "productId é obrigatório." },
        { status: 422 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { code: "INVALID_BODY", message: "file é obrigatório (multipart)." },
        { status: 422 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { code: "INVALID_FILE", message: "O arquivo enviado não é uma imagem." },
        { status: 422 },
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { code: "FILE_TOO_LARGE", message: "Imagem maior que 15MB." },
        { status: 422 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });
    if (!product) {
      return NextResponse.json(
        { code: "PRODUCT_NOT_FOUND", message: "Produto não encontrado." },
        { status: 404 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await saveUploadedProductImage({ productId: product.id, slug: product.slug, fileBuffer });

    return NextResponse.json({ url: `/products/${product.slug}.webp` });
  } catch (error) {
    console.error("[api/admin/images/upload] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
