import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError, parsePage } from "@/lib/api/handleApiError";
import type { ReferenceDataSort } from "@application/index";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await container.useCases.searchManufacturers.execute({
      search: searchParams.get("search") ?? undefined,
      includeInactive: searchParams.get("includeInactive") === "true",
      sort: (searchParams.get("sort") as ReferenceDataSort | null) ?? undefined,
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
    const manufacturer = await container.useCases.createManufacturer.execute(body);
    return NextResponse.json(manufacturer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
