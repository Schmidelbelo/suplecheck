import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? <div className="text-text-subtle [&_svg]:size-10">{icon}</div> : null}
      <div className="flex flex-col gap-1">
        <p className="text-text text-sm font-medium">{title}</p>
        {description ? <p className="text-text-muted text-sm">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
