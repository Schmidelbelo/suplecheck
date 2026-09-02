import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "src/**/*.test.ts", "test/**/*.test.ts"],
    // Testes de Repository/Integration reaproveitam o mesmo PostgreSQL
    // (Neon) de dev — não podem rodar em paralelo entre arquivos
    // (colidiriam nos mesmos dados) mas cada teste dentro de um arquivo
    // usa slugs únicos.
    fileParallelism: false,
    // 60s: testes de integração fazem várias operações Prisma
    // sequenciais contra o Postgres remoto (Neon), cuja latência de
    // rede real pode superar um timeout mais curto em cenários com
    // mais chamadas encadeadas (ex.: geração de ranking).
    testTimeout: 60000,
  },
});
