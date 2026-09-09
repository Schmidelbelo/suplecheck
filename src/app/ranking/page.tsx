import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/lib/seo/JsonLd";
import { listCategoriesWithCounts } from "@/modules/category/services/categoryPage.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";

/**
 * `/ranking` era o placeholder "em preparação" antes de qualquer
 * categoria ter um ranking real. Creatina é a primeira (e, por ora,
 * única) categoria com Índice SupleScore calculado de ponta a ponta —
 * quando houver mais de uma categoria com ranking real, isto vira uma
 * página de índice em vez de um redirect fixo.
 */
export const metadata: Metadata = buildMetadata({ title: "Ranking de Suplementos: Creatina, Whey Protein e Mais", description: "Compare rankings de suplementos por categoria usando o Índice SupleScore, preço por dose e critérios editoriais transparentes.", path: "/ranking" });

const routes: Record<string, string> = { creatina: "/creatina" };

export default async function RankingPage() {
  const categories = (await listCategoriesWithCounts()).filter((category) => category.productCount > 0);
  const items = categories.map((category) => ({ name: `Ranking de ${category.name}`, href: routes[category.slug] ?? `/categorias/${category.slug}` }));
  return <><JsonLd data={breadcrumbSchema([{ label: "Início", href: "/" }, { label: "Rankings", href: "/ranking" }])} /><JsonLd data={itemListSchema(items)} /><PageHeader eyebrow="SupleScore" title="Rankings de suplementos" description="Escolha uma categoria para comparar produtos, notas e custo-benefício." /><Section><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => { const href = routes[category.slug] ?? `/categorias/${category.slug}`; return <Link key={category.slug} href={href} className="rounded-lg border border-border p-5 transition hover:border-primary hover:shadow-sm"><h2 className="font-semibold">Ranking de {category.name}</h2><p className="mt-2 text-sm text-muted-foreground">{category.productCount} produtos avaliados</p></Link>; })}</div></Section></>;
}
