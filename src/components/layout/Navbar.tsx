"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WishlistNavButton } from "./WishlistNavButton";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/Drawer";
import { primaryNav } from "@/config/nav";
import { VisuallyHidden } from "@/components/shared/VisuallyHidden";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="border-border bg-surface/80 sticky top-0 z-(--z-sticky) border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegação principal">
          {primaryNav.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "hover:text-text text-sm font-medium transition-colors",
                  isActive ? "text-text" : "text-text-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <WishlistNavButton />
          <Button variant="primary" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/creatina">Ver ranking</Link>
          </Button>

          <Drawer open={open} onOpenChange={setOpen}>
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
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
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
