import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          "border-border bg-surface text-text placeholder:text-text-subtle flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors",
          "focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-1 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus-visible:ring-danger",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
