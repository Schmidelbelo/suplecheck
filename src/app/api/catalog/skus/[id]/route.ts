import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const sku = await container.useCases.getSku.execute(id);
    return NextResponse.json(sku);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const sku = await container.useCases.updateSku.execute({ ...body, id });
    return NextResponse.json(sku);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Soft delete — transiciona para DISCONTINUED, nunca remove a linha. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await container.useCases.setSkuStatus.execute({ id, status: "DISCONTINUED" });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
