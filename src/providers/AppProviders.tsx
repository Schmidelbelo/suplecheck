"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { Toaster } from "@/components/ui/Toaster";

/**
 * Ponto único de composição de todos os providers client-side da aplicação.
 * Novos providers globais (auth, query client, feature flags) entram aqui,
 * nunca direto em app/layout.tsx.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
