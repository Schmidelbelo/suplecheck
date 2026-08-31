/**
 * Contrato uniforme de todo caso de uso da plataforma. `TRequest` e
 * `TResponse` são sempre tipos desta camada (Command/Query/DTO) —
 * jamais uma entidade de `packages/core`. Um Use Case é a única forma
 * de "entrar" na Application Layer: Infrastructure e Presentation nunca
 * chamam um Port, uma Policy ou o Domain diretamente, sempre um Use Case.
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

/** Casos de uso sem entrada (ex: listagens sem filtro). */
export interface ParameterlessUseCase<TResponse> {
  execute(): Promise<TResponse>;
}
