import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  siblingCount?: number;
}

function getPageRange(
  current: number,
  total: number,
  siblingCount: number,
): (number | "ellipsis")[] {
  const range: (number | "ellipsis")[] = [];
  const start = Math.max(2, current - siblingCount);
  const end = Math.min(total - 1, current + siblingCount);

  range.push(1);
  if (start > 2) range.push("ellipsis");
  for (let i = start; i <= end; i++) range.push(i);
  if (end < total - 1) range.push("ellipsis");
  if (total > 1) range.push(total);

  return range;
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = getPageRange(currentPage, totalPages, siblingCount);

  return (
    <nav aria-label="paginação" className={cn("flex items-center gap-1", className)} {...props}>
      <PaginationLink
        href={buildHref(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </PaginationLink>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="text-text-subtle px-2">
            …
          </span>
        ) : (
          <PaginationLink
            key={page}
            href={buildHref(page)}
            active={page === currentPage}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </PaginationLink>
        ),
      )}

      <PaginationLink
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  active,
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { active?: boolean; disabled?: boolean }) {
  if (disabled) {
    return (
      <span
        className={cn(
          "text-text-subtle inline-flex size-9 items-center justify-center rounded-md text-sm opacity-50",
          className,
        )}
      >
        {props.children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-sm transition-colors",
        active ? "bg-brand text-brand-foreground" : "text-text hover:bg-bg-subtle",
        className,
      )}
      {...props}
    />
  );
}
