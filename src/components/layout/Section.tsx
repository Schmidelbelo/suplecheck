import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div";
  containerClassName?: string;
  fullBleed?: boolean;
}

export function Section({
  as: Comp = "section",
  className,
  containerClassName,
  fullBleed = false,
  children,
  ...props
}: SectionProps) {
  return (
    <Comp className={cn("py-12 md:py-16 lg:py-20", className)} {...props}>
      {fullBleed ? children : <Container className={containerClassName}>{children}</Container>}
    </Comp>
  );
}
