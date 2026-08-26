import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "@/components/shared/Logo";
import { footerNav } from "@/config/nav";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-bg-subtle border-t">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-text-muted max-w-xs text-sm">
            Comparação inteligente de suplementos: rankings independentes baseados em dados, não em
            marketing.
          </p>
        </div>

        {footerNav.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h3 className="text-text text-sm font-semibold">{group.title}</h3>
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-text-muted hover:text-text text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <Container className="border-border text-text-subtle flex flex-col gap-2 border-t py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} SupleCheck. Todos os direitos reservados.</p>
        <p>Conteúdo editorial independente. Alguns links podem ser de afiliados.</p>
      </Container>
    </footer>
  );
}
