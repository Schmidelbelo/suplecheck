import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";

type Params = { params: Promise<{ idOrSlug: string }> };

/** Transição explícita de status do produto (DRAFT → IN_REVIEW → PUBLISHED → ...). */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const existing = await container.useCases.getSupplement.execute(idOrSlug);
    const { status } = await request.json();
    await container.useCases.setSupplementStatus.execute({ id: existing.id, status });
    const updated = await container.useCases.getSupplement.execute(existing.id);
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
