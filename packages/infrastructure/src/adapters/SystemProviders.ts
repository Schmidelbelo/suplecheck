import { randomUUID } from "node:crypto";
import type { ClockPort, IdGeneratorPort } from "../application-kernel";

/** Implementação real de `ClockPort` — o único lugar de toda a plataforma que chama `new Date()` "de verdade". */
export class SystemClockAdapter implements ClockPort {
  now(): Date {
    return new Date();
  }
}

/** Implementação real de `IdGeneratorPort` — UUID v4 via `node:crypto`, sem dependência externa. */
export class RandomUuidAdapter implements IdGeneratorPort {
  next(): string {
    return randomUUID();
  }
}
