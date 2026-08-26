import { prisma } from "@/lib/db/prisma";

/** Módulo `articles` — conteúdo editorial/blog (grupo de rota `(marketing)`). */
export const articleService = {
  async listPublished() {
    return prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });
  },

  async getBySlug(slug: string) {
    return prisma.article.findUnique({ where: { slug } });
  },
};
