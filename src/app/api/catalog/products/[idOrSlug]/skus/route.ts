import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError, parsePage } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    const { searchParams } = new URL(request.url);
    const result = await container.useCases.listSkusByProduct.execute({
      productId: product.id,
      page: parsePage(searchParams),
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    const body = await request.json();
    const sku = await container.useCases.createSku.execute({ ...body, productId: product.id });
    return NextResponse.json(sku, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
