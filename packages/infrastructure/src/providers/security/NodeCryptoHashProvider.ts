import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { HashProvider } from "./HashProvider";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/**
 * Implementação real, sem dependência externa: `scrypt` (`node:crypto`)
 * com salt aleatório por hash, formato `salt:hash` (ambos hex). Não é um
 * placeholder — é criptograficamente adequado para senha/segredo; só
 * não está conectado a nenhum fluxo de autenticação ainda (esse fluxo
 * não existe na Application Layer nesta etapa).
 */
export class NodeCryptoHashProvider implements HashProvider {
  async hash(plainText: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(plainText, salt, KEY_LENGTH)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    const [salt, storedHex] = hash.split(":");
    if (!salt || !storedHex) return false;

    const derivedKey = (await scryptAsync(plainText, salt, KEY_LENGTH)) as Buffer;
    const storedBuffer = Buffer.from(storedHex, "hex");
    if (storedBuffer.length !== derivedKey.length) return false;

    return timingSafeEqual(derivedKey, storedBuffer);
  }
}
