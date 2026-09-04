import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { FAQSection } from "@/components/marketing/FAQSection";
import { getCategoryPageData } from "@/modules/category/services/categoryPage.service";
import type { FaqItem } from "@/config/faq";

type Params = { params: Promise<{ slug: string }> };

/** Mesma regra de `/categorias/page.tsx`: categoria com rota própria nunca é servida por `[slug]` — evita conteúdo duplicado. */
const CATEGORY_ROUTE_OVERRIDES: Record<string, string> = { creatina: "/creatina" };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return buildMetadata({ title: "Categoria não encontrada", noIndex: true });

  return buildMetadata({
    title: `${data.category.name}: Ranking e Avaliações`,
    description:
      data.category.description ?? `Página da categoria ${data.category.name} no SupleScore.`,
    path: `/categorias/${slug}`,
  });
}

export const revalidate = 300;

export default async function CategoryDetailPage({ params }: Params) {
  const { slug } = await params;

  if (CATEGORY_ROUTE_OVERRIDES[slug]) {
    redirect(CATEGORY_ROUTE_OVERRIDES[slug]!);
  }

  const data = await getCategoryPageData(slug);
  if (!data) notFound();

  const faqItems: FaqItem[] = [
    {
      question: `Já existe ranking de ${data.category.name} no SupleScore?`,
      answer:
        data.products.length > 0
          ? `Sim — ${data.products.length} produto${data.products.length === 1 ? "" : "s"} de ${data.category.name} já ${data.products.length === 1 ? "foi avaliado" : "foram avaliados"} pelo Índice SupleScore.`
          : `Ainda não. A categoria ${data.category.name} está cadastrada no catálogo, mas nenhum produto foi avaliado pela metodologia SupleScore até o momento.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Categorias", href: "/categorias" },
          { label: data.category.name, href: `/categorias/${slug}` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqItems)} />

      <PageHeader
        eyebrow="Categoria"
        title={data.category.name}
        description={data.category.description ?? undefined}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Categorias", href: "/categorias" },
          { label: data.category.name },
        ]}
      />

      <Section>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="text-text-muted text-lg">
            Esta categoria ainda não tem produtos avaliados pela metodologia SupleScore — assim que
            tiver, o ranking completo aparece aqui automaticamente.
          </p>
          <Link href="/creatina" className="text-brand font-medium hover:underline">
            Ver o ranking de Creatina, já disponível
          </Link>
        </div>
      </Section>

      <FAQSection items={faqItems} />
    </>
  );
}
