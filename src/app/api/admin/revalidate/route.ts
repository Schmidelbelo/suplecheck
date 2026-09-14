import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { categoryBasePath, productDetailPath } from "@/lib/catalog/productRoutes";

interface RevalidateInput {
  readonly categorySlug: string;
  readonly productSlug?: string;
}

/**
 * Invalidação sob demanda, escopada só à categoria afetada — chamada
 * pelos scripts de publicação (`prisma/publish*.ts`) logo depois de
 * escrever no banco, para que a página estática (ISR, `revalidate`
 * padrão de 12h) reflita o produto novo sem esperar a janela inteira
 * nem exigir redeploy. Protegido em `src/middleware.ts` (`/api/admin`
 * é totalmente protegido, incluindo POST) — nunca chamável por um
 * visitante comum.
 *
 * Nunca revalida o catálogo inteiro: só os caminhos que realmente
 * dependem desta categoria/produto. `/ofertas` e `/creatina` derivam
 * do ranking de creatina especificamente (ver `rankingView.service.ts`
 * — `/ofertas` sempre lê a categoria "creatina"), então só entram na
 * lista quando a categoria afetada É creatina.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RevalidateInput | null;
  if (!body?.categorySlug) {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "categorySlug é obrigatório." },
      { status: 422 },
    );
  }

  const { categorySlug, productSlug } = body;
  const revalidated: string[] = [];

  const categoryPath = categoryBasePath(categorySlug);
  revalidatePath(categoryPath);
  revalidated.push(categoryPath);

  revalidatePath("/categorias");
  revalidated.push("/categorias");

  if (productSlug) {
    const productPath = productDetailPath(categorySlug, productSlug);
    revalidatePath(productPath);
    revalidated.push(productPath);
  }

  if (categorySlug === "creatina") {
    revalidatePath("/ofertas");
    revalidatePath("/mercado");
    revalidated.push("/ofertas", "/mercado");
  }

  return NextResponse.json({ revalidated });
}
