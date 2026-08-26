"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Container } from "./Container";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/Drawer";
import { primaryNav } from "@/config/nav";
import { VisuallyHidden } from "@/components/shared/VisuallyHidden";

export function Navbar() {
  return (
    <header className="border-border bg-surface/80 sticky top-0 z-(--z-sticky) border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegação principal">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-text-muted hover:text-text text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="primary" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="#newsletter">Receber ranking</Link>
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent side="right">
              <VisuallyHidden>
                <DrawerTitle>Menu de navegação</DrawerTitle>
              </VisuallyHidden>
              <nav className="mt-8 flex flex-col gap-4" aria-label="Navegação móvel">
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-text text-base font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </DrawerContent>
          </Drawer>
        </div>
      </Container>
    </header>
  );
}
