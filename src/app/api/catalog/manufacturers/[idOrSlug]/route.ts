import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const manufacturer = await container.useCases.getManufacturer.execute(idOrSlug);
    return NextResponse.json(manufacturer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getManufacturer.execute(idOrSlug);
    const body = await request.json();
    const manufacturer = await container.useCases.updateManufacturer.execute({
      ...body,
      id: existing.id,
    });
    return NextResponse.json(manufacturer);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Soft delete — desativa (`active=false`), nunca remove a linha. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getManufacturer.execute(idOrSlug);
    await container.useCases.setManufacturerActive.execute({ id: existing.id, active: false });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
