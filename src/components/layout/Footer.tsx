import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "@/components/shared/Logo";
import { SocialLinks } from "@/components/shared/SocialLinks";
import { LeadCaptureForm } from "@/modules/leads/components/LeadCaptureForm";
import { footerNav } from "@/config/nav";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-bg-subtle border-t">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)] lg:gap-8">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="text-text-muted max-w-xs text-sm">
            Comparação inteligente de suplementos: rankings independentes baseados em dados, não em
            marketing.
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-text text-sm font-medium">Receba o ranking por e-mail</p>
            <LeadCaptureForm source="footer_newsletter" submitLabel="Assinar" />
          </div>
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

      <Container className="border-border text-text-subtle flex flex-col gap-4 border-t py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p>© {year} SupleScore. Todos os direitos reservados.</p>
          <p>Conteúdo editorial independente. Alguns links podem ser de afiliados.</p>
        </div>
        <SocialLinks />
      </Container>
    </footer>
  );
}
