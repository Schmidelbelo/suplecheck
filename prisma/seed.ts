import { prisma } from "../src/lib/db/prisma";

/**
 * Seed inicial do banco. Populado de fato quando o ranking manual de
 * creatinas (Fase 0) for implementado — aqui apenas garante que o
 * pipeline `prisma db seed` está funcional desde o início.
 */
async function main() {
  console.warn("Seed placeholder — nenhum dado inserido ainda.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
