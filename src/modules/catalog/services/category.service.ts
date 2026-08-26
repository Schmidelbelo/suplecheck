import { prisma } from "@/lib/db/prisma";

/**
 * Módulo `catalog` — camada de serviço de categorias. Ainda sem uso em
 * páginas (Fase 0 não navega por categoria), mas a estrutura já reflete o
 * contrato final: rotas/páginas chamam serviços, serviços chamam Prisma.
 */
export const categoryService = {
  async listAll() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },

  async getBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },
};
