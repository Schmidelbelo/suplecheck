import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const category = await container.useCases.getCategory.execute(idOrSlug);
    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getCategory.execute(idOrSlug);
    const body = await request.json();
    const category = await container.useCases.updateCategory.execute({ ...body, id: existing.id });
    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Soft delete — desativa (`active=false`), nunca remove a linha (ver ARCHITECTURE.md §soft delete). */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getCategory.execute(idOrSlug);
    await container.useCases.setCategoryActive.execute({ id: existing.id, active: false });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
