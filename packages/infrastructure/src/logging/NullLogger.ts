import type { Logger } from "./Logger";

/** Null Object — usado em testes/smoke scripts que não querem poluir stdout. */
export class NullLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  child(): Logger {
    return this;
  }
}
