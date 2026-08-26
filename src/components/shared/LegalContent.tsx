import * as React from "react";

export interface LegalSection {
  title: string;
  body: React.ReactNode;
}

/** Layout tipográfico padrão para páginas legais (Privacidade, Termos, Cookies). */
export function LegalContent({
  sections,
  lastUpdated,
}: {
  sections: LegalSection[];
  lastUpdated: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <p className="text-text-subtle text-sm">Última atualização: {lastUpdated}</p>
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <h2 className="font-display text-text text-xl font-semibold">{section.title}</h2>
          <div className="text-text-muted [&_a]:text-brand flex flex-col gap-3 [&_a]:font-medium [&_a]:hover:underline [&_li]:ml-5 [&_li]:list-disc">
            {section.body}
          </div>
        </div>
      ))}
    </div>
  );
}
