"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLeadSchema, type CreateLeadInput } from "../validators/lead.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/useToast";
import { trackEvent } from "@/modules/analytics/services/analytics.service";
import { ANALYTICS_EVENTS } from "@/modules/analytics/types/event";
import { useCapturedEmail } from "../lib/useCapturedEmail";

export interface LeadCaptureFormProps {
  source?: string;
  className?: string;
  submitLabel?: string;
  /** Mensagem de sucesso customizada — o padrão fala em "ranking", nem sempre correto (ex.: alerta de preço). */
  successMessage?: string;
  /** Chamado depois que o `/api/leads` confirma o cadastro — útil para o chamador reagir imediatamente (ex.: esconder o próprio formulário). */
  onSuccess?: (email: string) => void;
}

/**
 * Formulário reutilizável de captura de e-mail. Recebe `source` para
 * identificar de onde veio o lead (landing, artigo, modal de saída…),
 * já que a mesma peça de UI será usada em vários pontos da plataforma.
 */
export function LeadCaptureForm({
  source = "landing_page",
  className,
  submitLabel = "Quero o ranking",
  successMessage = "Pronto! Enviamos o ranking para o seu e-mail.",
  onSuccess,
}: LeadCaptureFormProps) {
  const { setEmail: rememberEmailLocally } = useCapturedEmail();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { source },
  });

  async function onSubmit(data: CreateLeadInput) {
    let response: Response;
    try {
      response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      toast({
        variant: "danger",
        title: "Sem conexão no momento. Verifique sua internet e tente de novo.",
      });
      return;
    }

    if (!response.ok) {
      const isValidationError = response.status === 422;
      toast({
        variant: "danger",
        title: isValidationError
          ? "E-mail inválido — confira e tente de novo."
          : "Não foi possível cadastrar seu e-mail. Tente novamente em instantes.",
      });
      return;
    }

    trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBED, { source });
    toast({ variant: "success", title: successMessage });
    // Só depois do servidor confirmar — nunca lembramos um e-mail que não foi de fato cadastrado.
    rememberEmailLocally(data.email);
    onSuccess?.(data.email);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="seuemail@exemplo.com"
            aria-label="E-mail"
            aria-invalid={!!errors.email || undefined}
            aria-describedby={errors.email ? "lead-email-error" : undefined}
            error={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p id="lead-email-error" className="text-danger mt-1 text-xs">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
