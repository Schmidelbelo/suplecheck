import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError, parsePage } from "@/lib/api/handleApiError";
import { isTestSlug } from "@/lib/catalog/testDataGuard";
import type { ReferenceDataSort } from "@application/index";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const result = await container.useCases.searchCategories.execute({
      search,
      includeInactive: searchParams.get("includeInactive") === "true",
      sort: (searchParams.get("sort") as ReferenceDataSort | null) ?? undefined,
      page: parsePage(searchParams),
    });

    // Listagem sem busca explícita (a navegação/descoberta padrão) nunca
    // devolve categoria de teste vazada no banco — ver testDataGuard.ts.
    // Uma busca explícita (`search=`) preserva o comportamento atual: quem
    // já sabe o termo exato (admin, ou os próprios testes de integração
    // conferindo o registro que acabaram de criar) continua encontrando.
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
    const category = await container.useCases.createCategory.execute(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
