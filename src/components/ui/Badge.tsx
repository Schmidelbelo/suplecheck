import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit",
  {
    variants: {
      variant: {
        default: "bg-bg-muted text-text border-transparent",
        brand: "bg-brand-subtle text-brand border-transparent",
        // Opacidade de fundo em /15 (não /10): no /10, o texto sobre o
        // fundo quase-branco resultante não alcançava 4.5:1 (WCAG AA)
        // mesmo com a cor de texto mais escura. Ver auditoria da FASE 1,
        // Bloco 6.
        success: "bg-success/15 text-success border-transparent",
        warning: "bg-warning/15 text-warning border-transparent",
        danger: "bg-danger/15 text-danger border-transparent",
        outline: "bg-transparent text-text-muted border-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
