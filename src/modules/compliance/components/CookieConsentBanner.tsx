"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  type CookieConsentValue,
} from "@/modules/compliance/lib/cookieConsent";

function hasConsentCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((entry) => entry.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`));
}

function setConsentCookie(value: CookieConsentValue) {
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * Banner de consentimento de cookies (LGPD) — só aparece enquanto não
 * houver escolha registrada. `router.refresh()` depois de escolher
 * refaz a renderização do servidor (onde `AnalyticsScripts` decide se
 * injeta GA4/Clarity) sem recarregar a página inteira.
 */
export function CookieConsentBanner() {
  const router = useRouter();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(!hasConsentCookie());
  }, []);

  function choose(value: CookieConsentValue) {
    setConsentCookie(value);
    setVisible(false);
    router.refresh();
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Consentimento de cookies"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-(--z-toast) border-t p-4 shadow-lg sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-muted text-sm">
          Usamos cookies para melhorar sua experiência e entender como o SupleScore é usado. Você
          pode aceitar ou recusar os cookies de análise — a navegação continua funcionando
          normalmente de qualquer forma. Detalhes na{" "}
          <Link href="/cookies" className="text-brand font-medium hover:underline">
            Política de Cookies
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("rejected")}>
            Recusar
          </Button>
          <Button size="sm" onClick={() => choose("accepted")}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
