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

export interface LeadCaptureFormProps {
  source?: string;
  className?: string;
  submitLabel?: string;
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
}: LeadCaptureFormProps) {
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
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      toast({
        variant: "danger",
        title: "Não foi possível cadastrar seu e-mail. Tente novamente.",
      });
      return;
    }

    trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBED, { source });
    toast({ variant: "success", title: "Pronto! Enviamos o ranking para o seu e-mail." });
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
            error={!!errors.email}
            {...register("email")}
          />
          {errors.email ? <p className="text-danger mt-1 text-xs">{errors.email.message}</p> : null}
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
