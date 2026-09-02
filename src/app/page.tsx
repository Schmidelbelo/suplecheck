import { JsonLd, faqPageSchema } from "@/lib/seo/schema";
import { Hero } from "@/components/marketing/Hero";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IndexExplainer } from "@/components/marketing/IndexExplainer";
import { EvaluationCriteria } from "@/components/marketing/EvaluationCriteria";
import { Benefits } from "@/components/marketing/Benefits";
import { RankingPreview } from "@/components/marketing/RankingPreview";
import { NewsletterSection } from "@/components/marketing/NewsletterSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { homeFaq } from "@/config/faq";

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqPageSchema(homeFaq)} />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <IndexExplainer />
      <EvaluationCriteria />
      <Benefits />
      <RankingPreview />
      <NewsletterSection />
      <FAQSection items={homeFaq} />
      <FinalCTA />
    </>
  );
}
