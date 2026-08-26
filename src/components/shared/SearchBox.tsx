"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  containerClassName?: string;
}

export const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ className, containerClassName, onSearch, onKeyDown, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", containerClassName)}>
        <Search
          className="text-text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          placeholder="Buscar produtos, marcas ou categorias…"
          className={cn(
            "border-border bg-surface text-text placeholder:text-text-subtle h-10 w-full rounded-full border pr-4 pl-9 text-sm",
            "focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:outline-none",
            className,
          )}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key === "Enter") {
              onSearch?.(event.currentTarget.value);
            }
          }}
          {...props}
        />
      </div>
    );
  },
);
SearchBox.displayName = "SearchBox";
