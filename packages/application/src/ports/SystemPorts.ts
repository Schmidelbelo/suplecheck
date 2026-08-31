/** Fonte única de "agora" — nenhum Use Case chama `new Date()` diretamente, para permanecer testável. */
export interface ClockPort {
  now(): Date;
}

/** Fonte única de geração de identificadores — a Application não decide se é UUID, cuid ou ULID. */
export interface IdGeneratorPort {
  next(): string;
}
