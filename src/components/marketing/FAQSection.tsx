import { Section } from "@/components/layout/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import type { FaqItem } from "@/config/faq";

export function FAQSection({ items }: { items: FaqItem[] }) {
  return (
    <Section className="border-border bg-bg-subtle border-b">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-text text-3xl font-bold md:text-4xl">
          Perguntas frequentes
        </h2>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <Accordion
          type="single"
          collapsible
          className="border-border bg-surface rounded-lg border px-6"
        >
          {items.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
