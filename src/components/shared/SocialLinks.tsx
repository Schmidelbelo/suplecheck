import { Camera, Briefcase, Video } from "lucide-react";
import { socialLinks } from "@/config/nav";
import { cn } from "@/lib/utils";

/**
 * lucide-react removeu ícones de marcas (Instagram/LinkedIn/YouTube) nas
 * versões recentes por questão de licenciamento — usamos equivalentes
 * genéricos até termos um ícone de marca próprio.
 */
const ICONS = {
  instagram: Camera,
  linkedin: Briefcase,
  youtube: Video,
} as const;

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {socialLinks.map((social) => {
        const Icon = ICONS[social.icon];
        return (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="border-border text-text-muted hover:border-brand hover:text-brand flex size-9 items-center justify-center rounded-full border transition-colors"
          >
            <Icon className="size-4" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
