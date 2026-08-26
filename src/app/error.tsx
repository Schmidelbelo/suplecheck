"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/layout/Section";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-text text-2xl font-semibold">Algo deu errado</h1>
      <p className="text-text-muted max-w-md">
        Ocorreu um erro inesperado ao carregar esta página. Tente novamente.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </Section>
  );
}
