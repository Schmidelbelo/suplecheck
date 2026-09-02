import { prisma } from "@/lib/db/prisma";
import type { ProductFilters } from "../types";

export const productService = {
  async list(filters: ProductFilters = {}) {
    const { categorySlug, brandSlug, search, page = 1, perPage = 20 } = filters;

    return prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        category: categorySlug ? { slug: categorySlug } : undefined,
        brand: brandSlug ? { slug: brandSlug } : undefined,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      include: { category: true, brand: true },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    });
  },

  async getBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        scores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      },
    });
  },
};
