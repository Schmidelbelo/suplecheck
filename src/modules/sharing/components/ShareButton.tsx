"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { toast } from "@/hooks/useToast";

export interface ShareButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  /** Título compartilhado — obrigatório para o Web Share API funcionar de forma útil. */
  title: string;
  /** URL a compartilhar — padrão: a URL atual da página (`window.location.href`). */
  url?: string;
  text?: string;
  /** Rótulo do botão — padrão "Compartilhar". Passe `""` para um botão só com ícone (usar com `size="icon"`). */
  label?: string;
}

/**
 * Botão de compartilhamento único, reusado em produto/comparação/
 * ranking — usa a Web Share API (menu nativo do sistema) quando
 * disponível; caso contrário, copia o link para a área de transferência
 * e avisa via toast. Nunca falha silenciosamente: `navigator.share`
 * rejeitada pelo usuário (cancelou o menu) não mostra erro nenhum — só
 * uma falha real de verdade (ex.: clipboard bloqueado) mostra toast de
 * erro.
 */
export function ShareButton({ title, url, text, label = "Compartilhar", ...buttonProps }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleShare() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        await copyToClipboard(shareUrl);
      }
      return;
    }

    await copyToClipboard(shareUrl);
  }

  async function copyToClipboard(shareUrl: string) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar o link", variant: "danger" });
    }
  }

  const displayLabel = copied ? "Copiado" : label;

  return (
    <Button variant="outline" size="sm" onClick={handleShare} {...buttonProps}>
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {displayLabel || <span className="sr-only">Compartilhar</span>}
    </Button>
  );
}

/** Variante compacta, só ícone — para caber em cards de listagem sem quebrar o layout. */
export function ShareIconButton({ title, url, text }: Omit<ShareButtonProps, "label">) {
  return (
    <ShareButton
      title={title}
      url={url}
      text={text}
      size="icon"
      variant="ghost"
      aria-label="Compartilhar"
      label=""
    />
  );
}
