import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/layout/Section";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { AssistantWizard } from "@/modules/recommendation/components/AssistantWizard";
import { RecommendationResultView } from "@/modules/recommendation/components/RecommendationResultView";
import {
  decodeProfileFromSearchParams,
  isProfileComplete,
  encodeProfileToSearchParams,
} from "@/modules/recommendation/lib/profileQuery";
import type { RecommendationApiResponse } from "@/modules/recommendation/types";

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

  const recommendation = complete
    ? await fetchApiOrNull<RecommendationApiResponse>(
        `/api/recommendation?${encodeProfileToSearchParams(profile).toString()}`,
      )
    : null;

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
