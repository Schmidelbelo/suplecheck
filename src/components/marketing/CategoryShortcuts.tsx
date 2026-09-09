import Link from "next/link";
import { Section } from "@/components/layout/Section";

const categories = [
  ["Whey Protein", "/categorias/whey-protein", "compare proteína, preço e nota"],
  ["Pré-Treino", "/categorias/pre-treino", "compare fórmulas e custo por dose"],
  ["Ômega 3", "/categorias/omega-3", "compare concentração e transparência"],
  ["Cafeína", "/categorias/cafeina", "compare dose e custo-benefício"],
  ["Creatina", "/creatina", "veja o ranking atualizado"],
] as const;

export function CategoryShortcuts() {
  return <Section className="bg-surface-muted/40" aria-labelledby="categorias-em-destaque"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Compare antes de comprar</p><h2 id="categorias-em-destaque" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Encontre o suplemento certo</h2></div><Link className="hidden text-sm font-semibold text-primary hover:underline sm:block" href="/categorias">Ver todas</Link></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{categories.map(([name, href, description]) => <Link key={href} href={href} className="group rounded-lg border border-border bg-background p-4 transition hover:border-primary hover:shadow-sm"><span className="text-base font-semibold group-hover:text-primary">{name}</span><span className="mt-2 block text-sm text-muted-foreground">{description}</span></Link>)}</div></Section>;
}
