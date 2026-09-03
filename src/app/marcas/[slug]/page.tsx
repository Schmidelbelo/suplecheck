import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema, itemListSchema, faqPageSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import { ShareButton } from "@/modules/sharing/components/ShareButton";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { getBrandPageData } from "@/modules/brand/services/brandPage.service";
import type { FaqItem } from "@/config/faq";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBrandPageData(slug);
  if (!data) return buildMetadata({ title: "Marca não encontrada", noIndex: true, path: `/marcas/${slug}` });

  return buildMetadata({
    title: `${data.brand.name}: Produtos Avaliados e Nota Média`,
    description: data.stats
      ? `${data.brand.name} no SupleCheck: ${data.stats.productCount} produto(s) avaliado(s), nota média ${data.stats.averageScore.toFixed(1)}. Compare preço, nota e transparência do rótulo.`
      : `Página da marca ${data.brand.name} no SupleCheck.`,
    path: `/marcas/${slug}`,
  });
}

export const revalidate = 300;

function buildBrandFaq(data: NonNullable<Awaited<ReturnType<typeof getBrandPageData>>>): FaqItem[] {
  if (!data.stats) return [];
  const { brand, stats } = data;
  return [
    {
      question: `Quantos produtos da ${brand.name} o SupleCheck avalia?`,
      answer: `O SupleCheck avalia ${stats.productCount} produto${stats.productCount === 1 ? "" : "s"} da ${brand.name} até o momento.`,
    },
    {
      question: `Qual a nota média da ${brand.name} no Índice SupleCheck?`,
      answer: `A nota média dos produtos avaliados da ${brand.name} é ${stats.averageScore.toFixed(1)} de 100.`,
    },
    {
      question: `Qual o produto mais bem avaliado da ${brand.name}?`,
      answer: `O produto com melhor nota da ${brand.name} é ${stats.bestProduct.name}, com ${stats.bestProduct.finalScore.toFixed(1)} pontos no Índice SupleCheck.`,
    },
  ];
}

export default async function BrandDetailPage({ params }: Params) {
  const { slug } = await params;
  const data = await getBrandPageData(slug);
  if (!data) notFound();

  const { brand, stats, products } = data;
  const faqItems = buildBrandFaq(data);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Marcas", href: "/marcas" },
          { label: brand.name, href: `/marcas/${slug}` },
        ])}
      />
      {products.length > 0 ? (
        <JsonLd
          data={itemListSchema(
            products.map((p) => ({ name: p.productName, href: `/creatina/${p.productSlug}` })),
          )}
        />
      ) : null}
      {faqItems.length > 0 ? <JsonLd data={faqPageSchema(faqItems)} /> : null}

      <PageHeader
        eyebrow="Marca"
        title={brand.name}
        description={
          stats
            ? `${stats.productCount} produto${stats.productCount === 1 ? "" : "s"} avaliado${stats.productCount === 1 ? "" : "s"} · nota média ${stats.averageScore.toFixed(1)}`
            : "Ainda não há produtos avaliados desta marca."
        }
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Marcas", href: "/marcas" },
          { label: brand.name },
        ]}
      />

      <Section className="border-border border-b">
        <div className="flex items-center justify-between gap-4">
          {stats ? (
            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col gap-1 p-5">
                  <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                    Nota média
                  </p>
                  <p className="text-text text-2xl font-bold">{stats.averageScore.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 p-5">
                  <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                    Preço médio
                  </p>
                  <p className="text-text text-2xl font-bold">
                    {stats.averagePriceCents != null ? formatCurrencyBRL(stats.averagePriceCents) : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1 p-5">
                  <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                    Produtos avaliados
                  </p>
                  <p className="text-text text-2xl font-bold">{stats.productCount}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-text-muted text-sm">
              Assim que um produto desta marca for avaliado, as estatísticas aparecem aqui.
            </p>
          )}
          <ShareButton title={`${brand.name} no SupleCheck`} />
        </div>
      </Section>

      <Section>
        <div className="flex flex-col gap-6">
          <h2 className="text-text text-2xl font-bold">Produtos da {brand.name}</h2>
          {products.length === 0 ? (
            <EmptyState title="Nenhum produto avaliado desta marca ainda" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link key={product.productId} href={`/creatina/${product.productSlug}`}>
                  <Card className="hover:border-border-strong flex h-full flex-col gap-3 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
                    <ProductMiniCard
                      imageUrl={product.imageUrl}
                      name={product.productName}
                      brandName={brand.name}
                      priceCents={product.priceCents}
                      classificationTier={product.classificationTier}
                      score={product.overallScore}
                    />
                  </Card>
                </Link>
              ))}
            </div>
          )}
          <Link href="/marcas" className="text-brand text-sm font-medium hover:underline">
            Ver todas as marcas
          </Link>
        </div>
      </Section>

      {faqItems.length > 0 ? <FAQSection items={faqItems} /> : null}
    </>
  );
}
