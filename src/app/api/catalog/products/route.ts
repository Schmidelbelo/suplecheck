import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError, parsePage } from "@/lib/api/handleApiError";
import type { SupplementSort } from "@application/index";

/**
 * Sem `includeAllStatuses=true`, retorna só produtos PUBLISHED — é o
 * catálogo público. `includeAllStatuses=true` é uso administrativo
 * (lista rascunhos, arquivados etc.) e não tem controle de acesso ainda
 * (fora do escopo desta etapa — ver ARCHITECTURE.md).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await container.useCases.searchSupplements.execute({
      categorySlug: searchParams.get("categorySlug") ?? undefined,
      brandSlug: searchParams.get("brandSlug") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: (searchParams.get("sort") as SupplementSort | null) ?? undefined,
      includeAllStatuses: searchParams.get("includeAllStatuses") === "true",
      page: parsePage(searchParams),
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await container.useCases.registerSupplement.execute(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
