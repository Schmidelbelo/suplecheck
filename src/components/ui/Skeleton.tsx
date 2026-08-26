import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-skeleton-pulse bg-bg-muted rounded-md", className)} {...props} />
  );
}
