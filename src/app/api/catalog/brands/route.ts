import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError, parsePage } from "@/lib/api/handleApiError";
import { isTestSlug } from "@/lib/catalog/testDataGuard";
import type { ReferenceDataSort } from "@application/index";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const result = await container.useCases.searchBrands.execute({
      search,
      includeInactive: searchParams.get("includeInactive") === "true",
      sort: (searchParams.get("sort") as ReferenceDataSort | null) ?? undefined,
      page: parsePage(searchParams),
    });

    // Listagem sem busca explícita nunca devolve marca de teste vazada
    // no banco — mesma proteção de `/api/catalog/categories` (ver
    // testDataGuard.ts). Busca explícita preserva o comportamento atual.
    if (!search) {
      const items = result.items.filter((item) => !isTestSlug(item.slug));
      const removed = result.items.length - items.length;
      return NextResponse.json({ ...result, items, total: result.total - removed });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brand = await container.useCases.createBrand.execute(body);
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
