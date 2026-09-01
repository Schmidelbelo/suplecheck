import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);
    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getSupplement.execute(idOrSlug);
    const body = await request.json();
    const product = await container.useCases.updateSupplement.execute({ ...body, id: existing.id });
    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Soft delete — transiciona para ARCHIVED, nunca remove a linha (Domain Model §3.1). */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getSupplement.execute(idOrSlug);
    await container.useCases.deleteSupplement.execute({ id: existing.id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
