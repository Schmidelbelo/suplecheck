import { prisma } from "../src/lib/db/prisma";

/**
 * Seed inicial do módulo Catálogo — Categorias, Marcas e Fabricantes
 * mínimos para o app funcionar de ponta a ponta (cadastro de Produto/SKU
 * exige que categoria/marca já existam). Idempotente: usa `upsert` por
 * slug, então rodar `prisma db seed` várias vezes não duplica nada.
 */

const CATEGORIES = [
  {
    slug: "creatina",
    name: "Creatina",
    description: "Suplementos de creatina em suas variações (monohidratada, HCL, etc.)",
  },
  {
    slug: "whey-protein",
    name: "Whey Protein",
    description: "Proteínas do soro do leite (concentrado, isolado, hidrolisado)",
  },
  {
    slug: "pre-treino",
    name: "Pré-treino",
    description: "Fórmulas estimulantes e não-estimulantes para performance no treino",
  },
  {
    slug: "multivitaminicos",
    name: "Multivitamínicos",
    description: "Combinações de vitaminas e minerais",
  },
  { slug: "omega-3", name: "Ômega 3", description: "Ácidos graxos essenciais (EPA/DHA)" },
] as const;

const BRANDS = [
  { slug: "growth-supplements", name: "Growth Supplements" },
  { slug: "max-titanium", name: "Max Titanium" },
  { slug: "integralmedica", name: "Integralmédica" },
  { slug: "black-skull", name: "Black Skull" },
  { slug: "dux-nutrition", name: "Dux Nutrition" },
] as const;

const MANUFACTURERS = [
  {
    slug: "growth-industria",
    name: "Growth Indústria e Comércio Ltda",
    country: "Brasil",
    certifications: ["ANVISA"],
  },
  {
    slug: "integralmedica-industria",
    name: "Integralmédica Indústria Ltda",
    country: "Brasil",
    certifications: ["ANVISA", "ISO 22000"],
  },
  {
    slug: "dux-industria",
    name: "Dux Nutrition Lab Indústria Ltda",
    country: "Brasil",
    certifications: ["ANVISA"],
  },
] as const;

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, description: category.description },
    });
  }
  console.warn(`Seed: ${CATEGORIES.length} categorias.`);

  for (const brand of BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: { name: brand.name },
    });
  }
  console.warn(`Seed: ${BRANDS.length} marcas.`);

  for (const manufacturer of MANUFACTURERS) {
    await prisma.manufacturer.upsert({
      where: { slug: manufacturer.slug },
      create: manufacturer,
      update: {
        name: manufacturer.name,
        country: manufacturer.country,
        certifications: manufacturer.certifications,
      },
    });
  }
  console.warn(`Seed: ${MANUFACTURERS.length} fabricantes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
