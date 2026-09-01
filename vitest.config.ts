import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "src/**/*.test.ts", "test/**/*.test.ts"],
    // Testes de Repository/Integration reaproveitam o mesmo SQLite de dev —
    // não podem rodar em paralelo entre arquivos (colidiriam nos mesmos
    // dados) mas cada teste dentro de um arquivo usa slugs únicos.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
