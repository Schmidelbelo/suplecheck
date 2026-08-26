/**
 * Bag genérico e imutável de fatos sobre um suplemento, usado como
 * entrada para qualquer critério. É deliberadamente uma estrutura
 * chave→valor (não um objeto fixo) para que novos critérios possam
 * consumir novos fatos sem exigir alteração desta classe — a extensão
 * acontece adicionando uma chave, nunca alterando o tipo do contexto
 * (ver `FactKeys` e `EvaluationContextBuilder` para a camada tipada por
 * cima deste bag).
 */
export class EvaluationContext {
  private constructor(private readonly facts: ReadonlyMap<string, unknown>) {}

  static empty(): EvaluationContext {
    return new EvaluationContext(new Map());
  }

  static from(facts: Readonly<Record<string, unknown>>): EvaluationContext {
    return new EvaluationContext(new Map(Object.entries(facts)));
  }

  with(key: string, value: unknown): EvaluationContext {
    const next = new Map(this.facts);
    next.set(key, value);
    return new EvaluationContext(next);
  }

  get<T>(key: string): T | undefined {
    return this.facts.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.facts.has(key);
  }

  keys(): string[] {
    return [...this.facts.keys()];
  }
}
