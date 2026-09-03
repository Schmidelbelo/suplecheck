import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tags } from "lucide-react";
import { listBrandsWithStats } from "@/modules/brand/services/brandPage.service";

export const metadata: Metadata = buildMetadata({
  title: "Marcas de Suplementos Avaliadas",
  description:
    "Todas as marcas de suplementos avaliadas pelo SupleCheck — nota média, quantidade de produtos e preço médio, calculados a partir de dados reais.",
  path: "/marcas",
});

export const revalidate = 300;

export default async function BrandsIndexPage() {
  const brands = await listBrandsWithStats();
  const withStats = brands.filter((b) => b.stats != null);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Marcas", href: "/marcas" },
        ])}
      />
      {withStats.length > 0 ? (
        <JsonLd
          data={itemListSchema(
            withStats.map((b) => ({ name: b.name, href: `/marcas/${b.slug}` })),
          )}
        />
      ) : null}

      <PageHeader
        eyebrow="Marcas"
        title="Marcas de suplementos avaliadas"
        description="Todas as marcas do catálogo do SupleCheck, com nota média, quantidade de produtos avaliados e preço médio — calculado em tempo real, nunca patrocinado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Marcas" }]}
      />

      <Section>
        {brands.length === 0 ? (
          <EmptyState icon={<Tags aria-hidden />} title="Nenhuma marca cadastrada ainda" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link key={brand.slug} href={`/marcas/${brand.slug}`}>
                <Card className="hover:border-border-strong flex h-full flex-col gap-2 p-5 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
                  <CardContent className="flex flex-col gap-2 p-0">
                    <p className="text-text text-lg font-semibold">{brand.name}</p>
                    {brand.stats ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="text-text-muted">
                          Nota média:{" "}
                          <span className="text-text font-medium">
                            {brand.stats.averageScore.toFixed(1)}
                          </span>
                        </span>
                        <span className="text-text-muted">
                          {brand.stats.productCount} produto{brand.stats.productCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-text-subtle text-sm">Ainda sem produtos avaliados.</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
