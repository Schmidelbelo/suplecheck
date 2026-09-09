import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = buildMetadata({ title: "Guias de Suplementos", description: "Guias práticos do SupleScore para comparar suplementos com mais clareza.", path: "/artigos" });
const links = [["Melhor Creatina Custo-Benefício em 2026", "melhor-creatina-custo-beneficio-2026"], ["Como comparar Whey Protein corretamente", "como-comparar-whey-protein-corretamente"], ["Pré-Treino: o que realmente importa antes de comprar", "pre-treino-o-que-importa-antes-de-comprar"]];
export default function ArticlesPage() { return <><PageHeader eyebrow="SupleScore" title="Guias de suplementos" description="Conteúdo direto para comparar produtos e comprar melhor." /><Section><div className="grid gap-4 md:grid-cols-3">{links.map(([title, slug]) => <Link key={slug} href={`/artigos/${slug}`} className="rounded-lg border border-border p-5 hover:border-primary"><h2 className="font-semibold">{title}</h2><span className="mt-4 block text-sm text-primary">Ler guia →</span></Link>)}</div></Section></>; }
