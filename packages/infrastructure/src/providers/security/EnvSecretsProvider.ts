import type { SecretsProvider } from "./SecretsProvider";
import { InfrastructureNotConfiguredError } from "../../errors/InfrastructureError";

/**
 * Implementação real: lê segredos de variáveis de ambiente. É o padrão
 * até um cofre dedicado (Vault, AWS Secrets Manager, etc.) ser
 * necessário — a interface `SecretsProvider` já isola quem consome
 * segredos dessa decisão.
 */
export class EnvSecretsProvider implements SecretsProvider {
  constructor(private readonly source: Record<string, string | undefined> = process.env) {}

  get(key: string): string | undefined {
    return this.source[key];
  }

  require(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new InfrastructureNotConfiguredError(
        "EnvSecretsProvider",
        `variável "${key}" não definida`,
      );
    }
    return value;
  }
}
