import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // `server-only` normalmente resolve para `empty.js` via a condição
    // de export `react-server`, que só o bundler do Next define — sem
    // isso, o pacote lança um erro proposital assim que qualquer código
    // testado importa (direta ou transitivamente) um módulo marcado
    // `server-only` (ex.: `analytics.server.ts`). Mesma resolução que o
    // Next já faz em runtime de servidor, não um mock do nosso código.
    alias: [
      {
        find: "server-only",
        replacement: fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
      },
    ],
  },
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
