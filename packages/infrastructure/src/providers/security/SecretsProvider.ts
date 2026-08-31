export interface SecretsProvider {
  get(key: string): string | undefined;
  require(key: string): string;
}
