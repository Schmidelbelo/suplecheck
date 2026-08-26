import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-text inline-flex items-center gap-2 text-lg font-bold",
        className,
      )}
    >
      <span
        className="bg-brand text-brand-foreground flex size-7 items-center justify-center rounded-md text-sm"
        aria-hidden
      >
        S
      </span>
      <span>
        Suple<span className="text-brand">Check</span>
      </span>
    </Link>
  );
}
