import * as React from "react";
import { Container } from "@/components/layout/Container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
}

/**
 * Cabeçalho padrão de todas as páginas institucionais — garante o mesmo
 * ritmo visual (breadcrumb, eyebrow, título, descrição) em Sobre,
 * Metodologia, Contato, páginas legais, etc.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-border bg-bg-subtle border-b", className)}>
      <Container className="flex flex-col gap-4 py-12 md:py-16">
        {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
        <div className="flex max-w-2xl flex-col gap-3">
          {eyebrow ? (
            <span className="text-brand text-sm font-semibold tracking-wide uppercase">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-display text-text text-3xl font-bold md:text-4xl">{title}</h1>
          {description ? <p className="text-text-muted text-lg">{description}</p> : null}
        </div>
      </Container>
    </div>
  );
}
