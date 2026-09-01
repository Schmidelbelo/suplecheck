import { NextResponse } from "next/server";
import { ApplicationError } from "@application/index";

const NOT_FOUND_CODES = new Set([
  "SUPPLEMENT_NOT_FOUND",
  "CATEGORY_NOT_FOUND",
  "BRAND_NOT_FOUND",
  "MANUFACTURER_NOT_FOUND",
  "SKU_NOT_FOUND",
  "METHODOLOGY_NOT_FOUND",
  "CRITERION_NOT_FOUND",
  "INDEX_RESULT_NOT_FOUND",
]);

const CONFLICT_CODES = new Set([
  "DUPLICATE_SUPPLEMENT_SLUG",
  "DUPLICATE_SLUG",
  "DUPLICATE_SKU_GTIN",
]);

/**
 * Traduz um erro lançado por um Use Case (`ApplicationError`) para uma
 * resposta HTTP. Único lugar da API que conhece esse mapeamento — cada
 * `route.ts` só chama isto dentro do `catch`.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApplicationError) {
    if (error.code === "VALIDATION_FAILED") {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 422 });
    }
    if (NOT_FOUND_CODES.has(error.code)) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 404 });
    }
    if (CONFLICT_CODES.has(error.code)) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 409 });
    }
    if (error.code === "POLICY_VIOLATION") {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 422 });
    }
    return NextResponse.json({ code: error.code, message: error.message }, { status: 400 });
  }

  console.error("[api] erro inesperado", error);
  return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
}

/** Lê `page`/`perPage` da querystring com defaults seguros. */
export function parsePage(searchParams: URLSearchParams): { page: number; perPage: number } {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? "20") || 20));
  return { page, perPage };
}
