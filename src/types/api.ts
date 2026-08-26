/** Envelope padrão de respostas de API — usado pelas rotas internas e, no futuro, pela API pública (Fase 7). */
export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  message: string;
  issues?: Record<string, string[] | undefined>;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
