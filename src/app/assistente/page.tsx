import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { AssistantWizard } from "@/modules/recommendation/components/AssistantWizard";
import { RecommendationResultView } from "@/modules/recommendation/components/RecommendationResultView";
import {
  decodeProfileFromSearchParams,
  isProfileComplete,
} from "@/modules/recommendation/lib/profileQuery";
import {
  getRecommendation,
  resolveCategoryForGoal,
} from "@/modules/recommendation/services/recommendationData.service";
import type { RecommendationApiResponse } from "@/modules/recommendation/types";

async function loadRecommendation(
  profile: ReturnType<typeof decodeProfileFromSearchParams>,
): Promise<RecommendationApiResponse | null> {
  const categorySlug = resolveCategoryForGoal(profile.goal);
  if (!categorySlug) return null;

  const result = await getRecommendation({
    categorySlug,
    priority: profile.priority,
    maxBudgetCents: profile.budgetCents,
  });
  if (!result) return null;

  return {
    categorySlug,
    weightsUsed: result.weightsUsed,
    ranking: result.ranking,
    recommended: result.recommended,
    runnerUp: result.runnerUp,
    cheapest: result.cheapest,
    comparisonNarrative: result.comparisonNarrative,
  };
}

export const metadata: Metadata = buildMetadata({
  title: "Assistente de Escolha",
  description:
    "Responda algumas perguntas e receba uma recomendação de creatina calculada a partir dos dados reais do catálogo — sem IA externa, sem posição paga.",
  path: "/assistente",
});

export const revalidate = 0;

type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AssistentePage({ searchParams }: Params) {
  const rawParams = await searchParams;
  const profile = decodeProfileFromSearchParams(rawParams);
  const complete = isProfileComplete(profile);

  const recommendation = complete ? await loadRecommendation(profile) : null;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Assistente de Escolha", href: "/assistente" },
        ])}
      />
      <PageHeader
        eyebrow="Assistente de Escolha"
        title="Qual creatina é a certa para você?"
        description="Responda algumas perguntas e receba uma recomendação calculada a partir do ranking real de creatina — nunca patrocinado, nunca com dado inventado."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Assistente de Escolha" }]}
      />

      <Section>
        {complete ? (
          <RecommendationResultView profile={profile} recommendation={recommendation} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <AssistantWizard />
          </div>
        )}
      </Section>
    </>
  );
}
