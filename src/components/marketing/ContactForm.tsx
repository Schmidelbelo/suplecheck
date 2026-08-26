"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";

const contactSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Informe um e-mail válido"),
  subject: z.enum(["duvida", "sugestao-produto", "parceria", "erro-dado", "outro"]),
  message: z.string().min(10, "Conte um pouco mais (mínimo 10 caracteres)"),
});

type ContactInput = z.infer<typeof contactSchema>;

const subjectOptions: { value: ContactInput["subject"]; label: string }[] = [
  { value: "duvida", label: "Dúvida geral" },
  { value: "sugestao-produto", label: "Sugestão de produto para avaliar" },
  { value: "parceria", label: "Parceria comercial" },
  { value: "erro-dado", label: "Reportar erro em um dado" },
  { value: "outro", label: "Outro assunto" },
];

/**
 * Formulário de contato apenas visual nesta etapa — ainda não há um
 * endpoint de backend para mensagens de contato (diferente do módulo
 * `leads`, que já está conectado). O envio simula sucesso via toast.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { subject: "duvida" },
  });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      variant: "success",
      title: "Mensagem enviada",
      description: "Recebemos seu contato e responderemos em breve.",
    });
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-text text-sm font-medium">
            Nome
          </label>
          <Input id="name" error={!!errors.name} {...register("name")} />
          {errors.name ? <p className="text-danger text-xs">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-text text-sm font-medium">
            E-mail
          </label>
          <Input id="email" type="email" error={!!errors.email} {...register("email")} />
          {errors.email ? <p className="text-danger text-xs">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="text-text text-sm font-medium">
          Assunto
        </label>
        <Controller
          control={control}
          name="subject"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="subject" aria-label="Assunto">
                <SelectValue placeholder="Selecione um assunto" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-text text-sm font-medium">
          Mensagem
        </label>
        <textarea
          id="message"
          rows={5}
          aria-invalid={!!errors.message || undefined}
          className="border-border bg-surface text-text placeholder:text-text-subtle flex w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) focus-visible:outline-none"
          {...register("message")}
        />
        {errors.message ? <p className="text-danger text-xs">{errors.message.message}</p> : null}
      </div>

      <Button type="submit" className="w-fit" isLoading={isSubmitting}>
        Enviar mensagem
      </Button>
    </form>
  );
}
