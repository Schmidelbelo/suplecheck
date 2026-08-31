export interface PageRequest {
  readonly page: number;
  readonly perPage: number;
}

export interface PageResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  readonly totalPages: number;
}

export function buildPageResult<T>(
  items: readonly T[],
  total: number,
  request: PageRequest,
): PageResult<T> {
  return {
    items,
    page: request.page,
    perPage: request.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / request.perPage)),
  };
}

export function defaultPageRequest(overrides: Partial<PageRequest> = {}): PageRequest {
  return { page: overrides.page ?? 1, perPage: overrides.perPage ?? 20 };
}
