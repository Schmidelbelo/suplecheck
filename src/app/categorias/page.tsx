import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listCategoriesWithCounts } from "@/modules/category/services/categoryPage.service";

export const metadata: Metadata = buildMetadata({
  title: "Categorias de Suplementos",
  description:
    "Todas as categorias de suplementos do SupleCheck — veja quais já têm ranking real calculado e quais ainda estão em avaliação.",
  path: "/categorias",
});

export const revalidate = 300;

/** Categoria com produto avaliado tem rota própria fora de `/categorias/[slug]` (ex.: `/creatina`) — nunca conteúdo duplicado sob duas URLs. */
const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

export default async function CategoriesIndexPage() {
  const categories = await listCategoriesWithCounts();
  const withProducts = categories.filter((c) => c.productCount > 0);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Categorias", href: "/categorias" },
        ])}
      />
      {withProducts.length > 0 ? (
        <JsonLd
          data={itemListSchema(
            withProducts.map((c) => ({
              name: c.name,
              href: CATEGORY_ROUTE_OVERRIDES[c.slug] ?? `/categorias/${c.slug}`,
            })),
          )}
        />
      ) : null}

      <PageHeader
        eyebrow="Categorias"
        title="Categorias de suplementos"
        description="Cada categoria ganha um ranking real assim que houver produtos avaliados com a metodologia SupleCheck."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Categorias" }]}
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={CATEGORY_ROUTE_OVERRIDES[category.slug] ?? `/categorias/${category.slug}`}
            >
              <Card className="hover:border-border-strong flex h-full flex-col gap-2 p-5 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
                <CardContent className="flex flex-col gap-2 p-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-text text-lg font-semibold">{category.name}</p>
                    {category.productCount > 0 ? (
                      <Badge variant="success">Ranking disponível</Badge>
                    ) : (
                      <Badge variant="outline">Em avaliação</Badge>
                    )}
                  </div>
                  {category.description ? (
                    <p className="text-text-muted text-sm">{category.description}</p>
                  ) : null}
                  <p className="text-text-subtle text-xs">
                    {category.productCount} produto{category.productCount === 1 ? "" : "s"} avaliado
                    {category.productCount === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
