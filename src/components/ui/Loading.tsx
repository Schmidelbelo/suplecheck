import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loading({
  className,
  label = "Carregando…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      className={cn("text-text-muted flex items-center justify-center gap-2 py-8", className)}
    >
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
