import type { Category, Product, Brand, ProductScore } from "@prisma/client";

export type { Category, Product, Brand, ProductScore };

export interface ProductWithRelations extends Product {
  category: Category;
  brand: Brand;
  scores: ProductScore[];
}

export interface ProductFilters {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  page?: number;
  perPage?: number;
}
