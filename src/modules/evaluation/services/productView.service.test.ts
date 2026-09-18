import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { uniqueSuffix } from "../../../../test/setupTestContainer";
import { productViewService } from "./productView.service";

/**
 * `loadPresentations` é a rede de segurança de exibição usada por
 * `/ofertas`, `/creatina`, `/mercado` e recomendações — mesmo que um
 * snapshot de ranking (gerado antes de uma despublicação) ainda
 * referencie o produto, ele nunca deve aparecer na vitrine pública.
 */
const suffix = uniqueSuffix();
const client = new PrismaClient();

describe("productViewService.loadPresentations", () => {
  it("não inclui produto UNPUBLISHED no Map de apresentações, mesmo pedido explicitamente por id", async () => {
    const category = await client.category.create({
      data: { slug: `pv-cat-${suffix}`, name: "Categoria ProductView" },
    });
    const brand = await client.brand.create({
      data: { slug: `pv-brand-${suffix}`, name: "Marca ProductView" },
    });
    const published = await client.product.create({
      data: {
        slug: `pv-published-${suffix}`,
        name: "Produto Publicado",
        categoryId: category.id,
        brandId: brand.id,
        status: "PUBLISHED",
      },
    });
    const unpublished = await client.product.create({
      data: {
        slug: `pv-unpublished-${suffix}`,
        name: "Produto Despublicado",
        categoryId: category.id,
        brandId: brand.id,
        status: "UNPUBLISHED",
      },
    });

    try {
      const presentations = await productViewService.loadPresentations([
        published.id,
        unpublished.id,
      ]);

      expect(presentations.has(published.id)).toBe(true);
      expect(presentations.has(unpublished.id)).toBe(false);
    } finally {
      await client.product.deleteMany({ where: { id: { in: [published.id, unpublished.id] } } });
      await client.brand.deleteMany({ where: { id: brand.id } });
      await client.category.deleteMany({ where: { id: category.id } });
      await client.$disconnect();
    }
  });
});
