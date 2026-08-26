/**
 * Result<T> — usado onde uma falha é uma condição esperada do domínio
 * (ex: dados de avaliação incompletos), e não uma exceção. Reserva
 * `throw` para violação de invariante (bug de quem chama o domínio).
 */
export type Result<T, E = string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "Result.unwrap() em um erro");
  }
  return result.value;
}
